// Importa o caso de uso real para montar a árvore de dependências no ambiente de testes
import { RefineDraftUseCase } from "@/application/refinement/use-cases/refine-draft.use-case.js";
// Importa a implementação real do serviço de IA para atuar nos testes de ponta a ponta
import { GroqLlamaService } from "@/infrastructure/ai/groq-llama.service.js";
// Importa o framework Express para instanciar um servidor HTTP efêmero isolado para os testes
import express from "express";
// Importa a biblioteca Supertest, responsável por simular requisições HTTP diretamente contra a instância do Express
import supertest from "supertest";
// Importa o controlador HTTP que será mapeado na rota de teste
import { RefineNoteController } from "../controllers/refine-note.controller.js";

// Instancia uma nova aplicação Express dedicada exclusivamente a esta suíte de testes
const app = express();
// Configura o middleware nativo do Express para interceptar e fazer o parse de payloads recebidos em formato JSON
app.use(express.json());

// Instancia o adaptador de infraestrutura de inteligência artificial
const service = new GroqLlamaService();
// Instancia o caso de uso injetando o serviço de IA real recém-criado
const useCase = new RefineDraftUseCase(service);
// Instancia o controlador injetando o caso de uso configurado
const controller = new RefineNoteController(useCase);

// Registra uma rota POST simulando o endpoint real do sistema e amarra a execução ao método handle do controlador
app.post("/api/v1/notes/refine", controller.handle);

// Agrupa a suíte de testes ponta a ponta (E2E) direcionada ao endpoint de refino de notas via REST
describe("E2E REST - POST /api/v1/notes/refine", () => {
  // Define o primeiro cenário focado no fluxo de sucesso com dados válidos enviados
  it("Deve retornar HTTP 200 e o payload mapeado corretamente pela IA", async () => {
    // Utiliza o supertest para disparar uma requisição POST real ao endpoint simulado, enviando um JSON válido
    const res = await supertest(app).post("/api/v1/notes/refine").send({
      scope: "cursos", // Envia um escopo homologado pelas regras de negócio
      raw_content: "Anotações da aula de microsserviços",
    });

    // Assere que o status code da resposta HTTP retornada pelo servidor foi estritamente 200 (OK)
    expect(res.status).toBe(200);
    // Assere que o objeto de resposta JSON possui a propriedade chave 'refined_content'
    expect(res.body).toHaveProperty("refined_content");
    // Assere que o conteúdo textual presente dentro do campo 'refined_content' contém o cabeçalho obrigatório do domínio
    expect(res.body.refined_content).toContain(
      "## Transposição para o CV Mestre",
    );
  });

  // Define o segundo cenário focado na rejeição de requisições que quebram regras do domínio
  it("Deve responder HTTP 422 quando o escopo violar invariantes do domínio", async () => {
    // Dispara uma requisição POST enviando intencionalmente um escopo inválido para forçar a falha do Value Object
    const res = await supertest(app).post("/api/v1/notes/refine").send({
      scope: "INVALIDO_ESCOPO", // Escopo não mapeado na lista estática interna do domínio
      raw_content: "Validação de erro",
    });

    // Assere que o controlador capturou o erro lançado pelo domínio e respondeu corretamente com o status 422
    expect(res.status).toBe(422);
  });
});
