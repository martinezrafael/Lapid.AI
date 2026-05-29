import fs from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import Opossum from "opossum";
import { db } from "../../../shared/infra/database/postgres.js";
import {
  rabbitChannel,
  MESSAGING_CONFIG,
} from "../../../shared/infra/messaging/rabbitmq.js";

// Inicializa o cliente oficial do Groq com a variável de ambiente validada
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configuração do Circuit Breaker para chamadas externas de IA
const breakerOptions = {
  timeout: 8000, // Limite de 8 segundos por chamada antes do estouro por timeout
  errorThresholdPercentage: 50, // Abre o circuito se 50% das chamadas falharem
  resetTimeout: 15000, // Aguarda 15 segundos em circuito aberto antes de tentar o estado meio-aberto
};

// Encapsula o SDK do Groq dentro do Circuit Breaker para evitar falhas em cascata
const groqBreaker = new Opossum(
  async ({
    model,
    messages,
    temperature,
  }: {
    model: string;
    messages: any[];
    temperature: number;
  }) => {
    return await groq.chat.completions.create({ model, messages, temperature });
  },
  breakerOptions,
);

export async function iniciarConsumerNotas(): Promise<void> {
  try {
    // RATE LIMITING / THROTTLING NATIVO: Configura o prefetch do canal AMQP
    // Garante que este Worker apenas processe 1 nota de cada vez de forma compassada
    await rabbitChannel.prefetch(1);

    console.log(
      `[*] Worker ativo e aguardando tarefas na fila: ${MESSAGING_CONFIG.QUEUE}`,
    );

    await rabbitChannel.consume(MESSAGING_CONFIG.QUEUE, async (msg) => {
      if (!msg) return;

      let currentNoteId: number | null = null;

      try {
        // Deserializa o Buffer recebido do RabbitMQ
        const { noteId, configJson } = JSON.parse(msg.content.toString());
        currentNoteId = noteId;

        // Cláusula de guarda distribuída: Garante a existência e o status imutável de processamento
        const note = await db("notes")
          .where({ id: currentNoteId, status: "PROCESSING" })
          .first();
        if (!note) {
          console.warn(
            `[Worker] Nota ID ${currentNoteId} pulada. Registro inexistente ou já processado.`,
          );
          rabbitChannel.ack(msg);
          return;
        }

        // 1. Resgata e mapeia o arquivo dinâmico de prompts (Mordaça estruturada)
        const caminhoPrompt = path.resolve(
          process.cwd(),
          "prompts",
          configJson,
        );
        if (!fs.existsSync(caminhoPrompt)) {
          throw new Error(
            `Arquivo de configuração de prompt não encontrado: ${configJson}`,
          );
        }
        const promptConfig = JSON.parse(
          fs.readFileSync(caminhoPrompt, "utf-8"),
        );

        // 2. Monta o payload unificando o viés executivo de engenharia + ADM do JSON
        const promptFinal = `
          ${promptConfig.system_prompt}

          DIRETRIZES OBRIGATÓRIAS DE REFINO:
          ${promptConfig.diretrizes.join("\n")}

          TEMPLATE OBRIGATÓRIO DE SAÍDA (PRESERVE TODOS OS TÍTULOS E EMOJIS):
          ${promptConfig.template_obrigatorio}

          CONTEÚDO BRUTO DO USUÁRIO A SER LAPIDADO:
          ${note.raw_content}
        `;

        // 3. Executa a lapidação inteligente protegida via Llama 3.3 70B
        const completionRefino = await groqBreaker.fire({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptFinal }],
          temperature: promptConfig.temperature || 0.15,
        });

        const refinedContent =
          completionRefino.choices[0].message.content || "";

        // 4. Executa a extração determinística da taxonomia (snake_case) via Llama 3.1 8B (Temp 0.0)
        const promptTaxonomia = `
          Você é um script backend rodando em terminal Linux. Extraia o assunto principal do título fornecido e converta-o estritamente para o padrão snake_case (letras minúsculas e separadas exclusivamente por sublinhados/underscores), sem incluir a extensão .md.
          Título: ${note.title}
        `;

        const completionTaxonomia = await groqBreaker.fire({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: promptTaxonomia }],
          temperature: 0.0,
        });

        const fileSlug =
          completionTaxonomia.choices[0].message.content
            ?.trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "") || `nota_${currentNoteId}`;

        // 5. Prepara os metadados NoSQL para enriquecimento no JSONB
        const enrichedAttributes = {
          processed_by: "Lapid.AI Microservice Worker",
          tokens_consumed: completionRefino.usage?.total_tokens || 0,
          api_enrich_at: new Date().toISOString(),
        };

        // PREVENÇÃO DE RACE CONDITIONS: Executa a fusão atômica em nível de banco de dados
        // Usa o operador binário '||' do PostgreSQL para mesclar chaves JSONB diretamente por SQL
        await db("notes")
          .where({ id: currentNoteId })
          .update({
            slug: fileSlug,
            refined_content: refinedContent,
            status: "PROCESSED",
            attributes: db.raw("attributes || ?::jsonb", [
              JSON.stringify(enrichedAttributes),
            ]),
          });

        console.log(
          `[Worker] Sucesso! Nota ID ${currentNoteId} processada com a taxonomia: ${fileSlug}`,
        );

        // Confirmação manual de sucesso (Ack) para remover o job da fila do broker
        rabbitChannel.ack(msg);
      } catch (error: any) {
        console.error(
          `[Worker] Falha persistente ao processar Nota ID ${currentNoteId}:`,
          error.message,
        );

        // REJEIÇÃO ATÔMICA (Nack): Requeue false encaminha o job diretamente para a Dead Letter Queue (DLQ)
        rabbitChannel.nack(msg, false, false);

        if (currentNoteId) {
          await db("notes")
            .where({ id: currentNoteId })
            .update({ status: "FAILED" });
        }
      }
    });
  } catch (error) {
    console.error(
      "❌ [Worker] Falha crítica na inicialização do Consumer do RabbitMQ:",
      error,
    );
    throw error;
  }
}

// Inicializador autônomo para execução direta do processo via terminal/worker-container
if (
  process.argv[1] ===
    path.resolve(process.cwd(), "dist/modules/notes/workers/NoteWorker.js") ||
  process.argv[1] ===
    path.resolve(process.cwd(), "src/modules/notes/workers/NoteWorker.ts")
) {
  const bootstrapWorker = async () => {
    const { inicializarRabbitMQ } =
      await import("../../../shared/infra/messaging/rabbitmq.js");
    await inicializarRabbitMQ();
    await iniciarConsumerNotas();
  };

  bootstrapWorker();
}
