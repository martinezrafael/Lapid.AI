// Importa a classe do caso de uso real para compor a árvore de injeção de dependências do teste de ponta a ponta
import { InjectSkillUseCase } from "@/application/career/use-cases/inject-skill.use-case.js";
// Importa o parser de expressões regulares de infraestrutura para utilizá-lo como o adapter do teste
import { RegexSkillParser } from "@/infrastructure/parsers/regex-skill.parser.js";
// Importa o framework Express para habilitar a instanciação de um servidor REST efêmero e isolado
import express from "express";
// Importa a biblioteca Supertest encarregada de simular chamadas de rede HTTP diretamente contra o app Express em memória
import supertest from "supertest";
// Importa a classe do controlador que gerenciará o processamento do endpoint a ser validado
import { InjectCareerController } from "../controllers/inject-career.controller.js";

// Instancia uma aplicação Express dedicada de forma exclusiva ao isolamento deste escopo de testes
const app = express();
// Adiciona o middleware nativo de interceptação global para processar adequadamente requests com corpos estruturados em JSON
app.use(express.json());

// Cria uma instância concreta do parser utilitário de infraestrutura
const parser = new RegexSkillParser();
// Cria uma instância real do caso de uso alimentando seu construtor com o parser recém-criado
const useCase = new InjectSkillUseCase(parser);
// Instancia o controlador injetando o caso de uso configurado (fechando a cadeia de dependências)
const controller = new InjectCareerController(useCase);
// Registra uma rota POST simulando o caminho exato exposto pela API do sistema amarrando a execução ao handler do controller
app.post("/api/v1/career/inject", controller.handle);

// Agrupa a suíte de testes automatizados ponta a ponta (E2E) com foco no endpoint de injeção de competências via REST
describe("🌐 E2E REST - POST /api/v1/career/inject", () => {
  // Define o cenário de teste assíncrono para verificar o sucesso da injeção quando um texto multilinha válido é fornecido
  it("Deve injetar com sucesso termos lidos por expressão regular multilinha", async () => {
    // Define uma string contendo um Markdown de currículo limpo contendo as duas âncoras exigidas para simular o banco de dados
    const rawCV = `# Currículo Mestre\n## 🧰 Banco de Hard Skills & Tecnologias\n## 🧠 Visão de Negócios`;
    // Define o rascunho de uma nota refinada com o título correto e contendo duas competências inéditas listadas em formato de itens Markdown
    const refinedNote = `## Transposição para o CV Mestre\n- NestJS\n- RabbitMQ`;

    // Dispara via supertest uma requisição POST fictícia ao endpoint enviando o payload serializado no corpo da chamada
    const res = await supertest(app).post("/api/v1/career/inject").send({
      cv_content: rawCV, // Envia o currículo mockado
      refined_note: refinedNote, // Envia a nota mockada com as habilidades
      scope: "cursos", // Envia um escopo válido aceito pelo domínio
    });

    // Assere que o status code de retorno HTTP devolvido pelo servidor Express foi estritamente igual a 200 (OK)
    expect(res.status).toBe(200);
    // Assere que a propriedade literal 'status' presente na raiz da resposta JSON possui exatamente o valor "synchronized"
    expect(res.body.status).toBe("synchronized");
    // Assere que o conteúdo textual presente na propriedade 'updated_cv_content' passou pelo fluxo do parser e agora contempla o termo "NestJS"
    expect(res.body.updated_cv_content).toContain("NestJS");
  });
});
