import type { RefineDraftUseCase } from "@/application/refinement/use-cases/refine-draft.use-case.js";
import type { RabbitMQClient } from "@/infrastructure/messaging/rabbitmq.client.js";
import { type Request, type Response } from "express";

export class RefineNoteAsyncController {
  constructor(
    private readonly refineDraftUseCase: RefineDraftUseCase,
    private readonly queueClient: RabbitMQClient,
  ) {}

  public handle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { scope, raw_content, cv_content_current } = req.body;

      if (!scope || !raw_content) {
        res.status(400).json({ error: "Faltando parâmetros mandatórios." });
        return;
      }

      // 1. Processa a inferência síncrona via IA
      const output = await this.refineDraftUseCase.execute({
        scope,
        rawContent: raw_content,
      });

      // 2. Dispara o evento de integração de forma não-bloqueante para a fila assíncrona
      await this.queueClient.publish("career.skills.inject", {
        scope,
        refined_note_content: output.refinedContent,
        cv_content:
          cv_content_current ||
          `# Currículo Mestre\n## 🧰 Banco de Hard Skills & Tecnologias\n## 🧠 Visão de Negócios`,
      });

      res.status(202).json({
        message:
          "Nota refinada com sucesso. Sincronização com o CV enviada para processamento assíncrono.",
        refined_content: output.refinedContent,
        suggested_filename: output.suggestedFilename,
      });
    } catch (error: any) {
      res.status(422).json({ error: error.message });
    }
  };
}
