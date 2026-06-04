// 🌟 Importando explicitamente as globais do Jest necessárias para o modo ESM nativo
import { jest, describe, it, expect, beforeEach } from "@jest/globals";

import { RefineDraftUseCase } from "@/application/refinement/use-cases/refine-draft.use-case.js";
import { GroqLlamaService } from "@/infrastructure/ai/groq-llama.service.js";
import { RabbitMQClient } from "@/infrastructure/messaging/rabbitmq.client.js";
import express from "express";
import supertest from "supertest";
import { RefineNoteAsyncController } from "../controllers/refine-note-async.controller.js";

// Instancia uma nova aplicação Express dedicada exclusivamente a esta suíte de testes
const app = express();
app.use(express.json());

// Instancia as dependências reais de serviço e caso de uso
const service = new GroqLlamaService();
const useCase = new RefineDraftUseCase(service);

// 🌟 Corrigido: Mock adaptado com assinatura genérica para satisfazer o compilador do TypeScript
const mockQueueClient = {
  publish: jest.fn(async (..._args: any[]): Promise<void> => {
    return Promise.resolve();
  }),
} as unknown as RabbitMQClient;

// Instancia o novo controlador assíncrono injetando as duas dependências exigidas
const controller = new RefineNoteAsyncController(useCase, mockQueueClient);

// Registra a rota HTTP apontando para o handler do novo controlador
app.post("/api/v1/notes/refine", controller.handle);

describe("🧪 E2E REST - POST /api/v1/notes/refine (Async Flow)", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Limpa o histórico de chamadas do mock entre os testes
  });

  it("Deve aceitar a nota com sucesso, postar na fila e retornar HTTP 202 Accepted", async () => {
    const res = await supertest(app).post("/api/v1/notes/refine").send({
      scope: "cursos",
      raw_content: "Anotações da aula de microsserviços",
      cv_content_current: "# Meu CV Atual",
    });

    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("refined_content");
    expect(res.body).toHaveProperty("suggested_filename");
    expect(res.body.message).toContain("processamento assíncrono");
    expect(res.body.refined_content).toContain(
      "## Transposição para o CV Mestre",
    );

    expect(mockQueueClient.publish).toHaveBeenCalledWith(
      "career.skills.inject",
      expect.objectContaining({
        scope: "cursos",
        refined_note_content: res.body.refined_content,
        cv_content: "# Meu CV Atual",
      }),
    );
  });

  it("Deve responder HTTP 400 Bad Request quando faltarem parâmetros obrigatórios", async () => {
    const res = await supertest(app).post("/api/v1/notes/refine").send({
      scope: "cursos",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("Faltando parâmetros mandatórios");
  });

  it("Deve responder HTTP 422 quando o escopo violar invariants do domínio", async () => {
    const res = await supertest(app).post("/api/v1/notes/refine").send({
      scope: "INVALIDO_ESCOPO",
      raw_content: "Validação de erro no Value Object",
    });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("error");
  });
});
