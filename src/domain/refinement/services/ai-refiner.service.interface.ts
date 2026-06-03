// Importa o Value Object RawContent apenas como tipo (import type) para evitar carregamento em tempo de execução
import type { RawContent } from "../value-objects/raw-content.vo.js";
// Importa o Value Object Scope apenas como tipo para validação estática do TypeScript
import type { Scope } from "../value-objects/scope.vo.js";

// Declara e exporta a interface que define a estrutura da resposta do serviço de Inteligência Artificial
export interface AIRefinementResponse {
  refinedContent: string; // O conteúdo textual já formatado e refinado pela IA
  suggestedFilename: string; // O nome de arquivo gerado pela IA baseado no conteúdo
}

// Declara e exporta a interface do serviço (contrato/Driven Port do domínio) para o refinador de IA
export interface AIRefinerService {
  // Define a assinatura do método 'refine', que recebe instâncias válidas de RawContent e Scope, retornando uma Promessa com a resposta estruturada
  refine(rawContent: RawContent, scope: Scope): Promise<AIRefinementResponse>;
}
