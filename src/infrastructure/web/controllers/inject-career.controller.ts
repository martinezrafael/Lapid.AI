// Importa o tipo do caso de uso InjectSkillUseCase para realizar a tipagem estática correta da propriedade injetada
import type { InjectSkillUseCase } from "@/application/career/use-cases/inject-skill.use-case.js";
// Importa os tipos explícitos Request e Response do pacote do Express para gerenciar o ciclo de vida HTTP
import { type Request, type Response } from "express";

// Declara e exporta a classe controladora encarregada de expor o fluxo de carreira como um endpoint REST
export class InjectCareerController {
  // O construtor recebe e armazena de forma imutável a instância do caso de uso necessário para realizar a operação (Injeção de Dependência)
  constructor(private readonly injectSkillUseCase: InjectSkillUseCase) {}

  // Define o método público 'handle' utilizando o padrão de arrow function assíncrona para blindar o escopo do 'this' interno
  public handle = async (req: Request, res: Response): Promise<void> => {
    // Inicia uma estrutura de captura de exceções para interceptar possíveis violações ou falhas internas
    try {
      // Aplica a desestruturação javascript para extrair os campos primitivos nomeados do corpo da requisição HTTP (JSON)
      const { cv_content, refined_note, scope } = req.body;

      // Valida de maneira simples se algum dos campos obrigatórios do payload de entrada deixou de ser enviado pelo cliente externo
      if (!cv_content || !refined_note || !scope) {
        // Responde de imediato enviando o status de erro HTTP 400 (Bad Request) com uma mensagem explicativa em formato JSON
        res.status(400).json({ error: "Mapeamento inválido de payload." });
        return; // Interrompe imediatamente o restante da execução da função controladora
      }

      // Invoca assincronamente a execução do caso de uso injetado enviando os dados mapeados para o DTO de entrada esperado
      const updatedCvContent = await this.injectSkillUseCase.execute({
        cvContent: cv_content, // Mapeia o snake_case vindo da API para o camelCase aceito pela camada de aplicação
        refinedNoteContent: refined_note,
        scope,
      });

      // Retorna para o cliente o status HTTP 200 (OK) finalizando a resposta com um JSON contendo o texto gerado e a confirmação de sincronismo
      res.status(200).json({
        updated_cv_content: updatedCvContent,
        status: "synchronized",
      });
    } catch (error: any) {
      // Captura eventuais erros estourados pelo domínio (como âncoras corrompidas) e responde com o status HTTP 422 (Unprocessable Entity)
      res.status(422).json({ error: error.message });
    }
  };
}
