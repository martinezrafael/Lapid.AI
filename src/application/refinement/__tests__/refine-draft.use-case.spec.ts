// Importa o objeto 'jest' explicitamente de '@jest/globals' para habilitar suporte a mocks em ambiente ESM
import { jest } from "@jest/globals";
// Importa o tipo da interface do serviço apenas para tipagem estática do mock do teste
import type { AIRefinerService } from "@/domain/refinement/services/ai-refiner.service.interface.js";
// Importa a classe do Caso de Uso que será testada nesta suíte
import { RefineDraftUseCase } from "../use-cases/refine-draft.use-case.js";

// Agrupa a suíte de testes unitários destinada a validar os comportamentos da classe RefineDraftUseCase
describe("Use Case - RefineDraftUseCase", () => {
  // Define o cenário de teste assíncrono focado no fluxo feliz de orquestração do caso de uso
  it("Deve orquestrar com sucesso a chamada e retornar a entidade refinada", async () => {
    // Cria um objeto de simulação (stub) contendo a função mockada com a mesma assinatura do serviço real
    const mockAIRefiner = {
      // Cria uma função espiã simulando o método 'refine' e configura para resolver imediatamente uma promessa com a resposta fictícia estruturada
      refine: jest.fn<AIRefinerService["refine"]>().mockResolvedValue({
        refinedContent: "## Transposição para o CV Mestre\n- NestJS",
        suggestedFilename: "curso_nestjs.md",
      }),
    };

    // Instancia o caso de uso injetando o objeto simulado (mockAIRefiner) no lugar da infraestrutura real de IA
    const useCase = new RefineDraftUseCase(mockAIRefiner);
    // Executa assincronamente o método principal do caso de uso passando strings válidas como payload de entrada
    const result = await useCase.execute({
      scope: "cursos",
      rawContent: "Fiz curso de NestJS hoje",
    });

    // Assere que o nome do arquivo retornado no resultado final do caso de uso coincide com o valor mockado pela IA
    expect(result.suggestedFilename).toBe("curso_nestjs.md");
    // Assere que o conteúdo refinado final entregue pelo caso de uso contém a seção textual esperada pela regra de negócio
    expect(result.refinedContent).toContain("## Transposição para o CV Mestre");
    // Assere e valida que a função espiã do serviço de IA foi invocada exatamente uma única vez durante todo o fluxo do teste
    expect(mockAIRefiner.refine).toHaveBeenCalledTimes(1);
  });
});
