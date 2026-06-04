import express from "express";

// Fluxo 1: Refino de Notas (Atualizado para a versão assíncrona)
import { RefineDraftUseCase } from "@/application/refinement/use-cases/refine-draft.use-case.js";
import { GroqLlamaService } from "@/infrastructure/ai/groq-llama.service.js";
import { RefineNoteAsyncController } from "@/infrastructure/web/controllers/refine-note-async.controller.js";
import { RabbitMQClient } from "@/infrastructure/messaging/rabbitmq.client.js";

// Fluxo 2: Gestão de Carreira
import { InjectSkillUseCase } from "@/application/career/use-cases/inject-skill.use-case.js";
import { RegexSkillParser } from "@/infrastructure/parsers/regex-skill.parser.js";
import { InjectCareerController } from "@/infrastructure/web/controllers/inject-career.controller.js";

const app = express();
app.use(express.json());

// =========================================================================
// INSTANCIAÇÃO E INJEÇÃO DE DEPENDÊNCIAS
// =========================================================================

// Configuração do Cliente de Mensageria (RabbitMQ)
const rabbitMQUrl =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const queueClient = new RabbitMQClient(rabbitMQUrl);
await queueClient.connect();

// Configuração do Fluxo 1: Refino de Rascunhos via IA + Mensageria Assíncrona
const aiService = new GroqLlamaService();
const refineUseCase = new RefineDraftUseCase(aiService);
const refineNoteController = new RefineNoteAsyncController(
  refineUseCase,
  queueClient,
);

// Configuração do Fluxo 2: Injeção de Competências no Currículo
const skillParser = new RegexSkillParser();
const injectSkillUseCase = new InjectSkillUseCase(skillParser);
const injectCareerController = new InjectCareerController(injectSkillUseCase);

// =========================================================================
// MAPEAMENTO DAS ROTAS HTTP (ENDPOINTS)
// =========================================================================

// Endpoint para refinar notas brutas enviadas pelo usuário (Retorna 202 Accepted)
app.post("/api/v1/notes/refine", refineNoteController.handle);

// Endpoint para ler habilidades da nota e sincronizar no Currículo Mestre via Regex
app.post("/api/v1/career/inject", injectCareerController.handle);

// Endpoint de checagem de integridade e atividade do servidor (Health Check)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "up" });
});

export { app };
