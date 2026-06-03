// Importa os tipos da resposta e da interface do serviço para garantir que a classe respeite o contrato do domínio
import type {
  AIRefinementResponse,
  AIRefinerService,
} from "@/domain/refinement/services/ai-refiner.service.interface.js";
// Importa o tipo do Value Object RawContent usado como parâmetro no método de refino
import type { RawContent } from "@/domain/refinement/value-objects/raw-content.vo.js";
// Importa o tipo do Value Object Scope usado como parâmetro no método de refino
import type { Scope } from "@/domain/refinement/value-objects/scope.vo.js";

// Declara e exporta a classe GroqLlamaService, implementando a interface/porta AIRefinerService (Adapter de Infraestrutura)
export class GroqLlamaService implements AIRefinerService {
  // Implementa o método público e assíncrono 'refine' exigido pelo contrato, recebendo os VOs e prometendo a resposta estruturada
  public async refine(
    rawContent: RawContent,
    scope: Scope,
  ): Promise<AIRefinementResponse> {
    // Retorna explicitamente uma Promise para gerenciar manualmente um comportamento assíncrono simulado
    return new Promise((resolve) => {
      // Define um temporizador para simular o atraso de rede ou de processamento de uma chamada de API de IA real
      setTimeout(() => {
        // Resolve a promessa entregando um objeto que simula a resposta estruturada do modelo Llama
        resolve({
          // Monta uma string simulando o texto formatado em Markdown com o valor extraído do VO de escopo e o texto do conteúdo bruto
          refinedContent: `# Curso: Refinado via Escopo [${scope.value}]\n\n${rawContent.text}\n\n## Transposição para o CV Mestre\n- Domain-Driven Design (DDD)\n- NestJS`,
          // Cria uma sugestão de nome de arquivo injetando o valor purificado do escopo e o timestamp atual para garantir unicidade
          suggestedFilename: `refinado_${scope.value}_${Date.now()}.md`,
        });
      }, 50); // Executa o bloco de resolução após um atraso exato de 50 milissegundos
    });
  }
}
