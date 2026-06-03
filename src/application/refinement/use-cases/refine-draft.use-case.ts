// Importa a interface do serviço de IA utilizando o alias '@/' para definir o tipo da dependência
import type { AIRefinerService } from "@/domain/refinement/services/ai-refiner.service.interface.js";
// Importa a classe RawContent para permitir a criação do Value Object correspondente
import { RawContent } from "@/domain/refinement/value-objects/raw-content.vo.js";
// Importa a classe RefinedNote para viabilizar a criação da Entidade de domínio no fluxo
import { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
// Importa a classe Scope para validar o escopo recebido na entrada do caso de uso
import { Scope } from "@/domain/refinement/value-objects/scope.vo.js";

// Define a estrutura de dados (DTO de entrada) aceita pelo caso de uso, recebendo apenas dados primitivos
export interface RefineDraftInput {
  scope: string; // String pura representando o escopo enviado pela camada externa
  rawContent: string; // String pura contendo o rascunho de texto bruto enviado
}

// Define a estrutura de dados (DTO de saída) retornada pelo caso de uso após o processamento bem-sucedido
export interface RefineDraftOutput {
  id: string; // Identificador único em formato string gerado para a nota refinada
  refinedContent: string; // O conteúdo textual purificado retornado ao cliente externo
  suggestedFilename: string; // O nome do arquivo sugerido retornado ao cliente externo
}

// Declara e exporta a classe do Caso de Uso, responsável por orquestrar a lógica de negócio dessa funcionalidade
export class RefineDraftUseCase {
  // O construtor recebe e injeta automaticamente como propriedade privada e imutável uma implementação do serviço AIRefinerService (Inversão de Dependência)
  constructor(private readonly aiRefinerService: AIRefinerService) {}

  // Define o método público e assíncrono principal que executa a lógica do caso de uso baseado nos dados de entrada
  public async execute(input: RefineDraftInput): Promise<RefineDraftOutput> {
    // Transforma a string de escopo primitiva em um Value Object seguro, disparando validações internas
    const scopeVO = Scope.create(input.scope);
    // Transforma a string de conteúdo bruto primitiva em um Value Object seguro, validando sua integridade
    const rawContentVO = RawContent.create(input.rawContent);

    // Invoca assincronamente o serviço de IA injetado, passando os objetos de valor validados e aguardando a resposta
    const aiResult = await this.aiRefinerService.refine(rawContentVO, scopeVO);

    // Instancia a Entidade de domínio RefinedNote combinando um UUID gerado nativamente com as respostas vindas da IA e os VOs
    const refinedNote = RefinedNote.create({
      id: crypto.randomUUID(), // Gera um identificador único universal versão 4 de forma nativa
      scope: scopeVO, // Associa o Value Object de escopo original
      content: aiResult.refinedContent, // Associa o conteúdo formatado devolvido pela IA
      suggestedFilename: aiResult.suggestedFilename, // Associa o nome de arquivo sugerido devolvido pela IA
    });

    // Retorna um objeto limpo (DTO) mapeando exclusivamente os dados extraídos dos getters da entidade instanciada
    return {
      id: refinedNote.id,
      refinedContent: refinedNote.content,
      suggestedFilename: refinedNote.suggestedFilename,
    };
  }
}
