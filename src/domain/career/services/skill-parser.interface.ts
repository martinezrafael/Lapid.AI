// Importa o Value Object Skill apenas como tipo para realizar a validação estática do TypeScript
import type { Skill } from "../value-objects/skill.vo.js";

// Declara e exporta a interface SkillParser, que define o contrato para um Domain Service (Serviço de Domínio)
export interface SkillParser {
  // Define a assinatura do método que recebe um bloco de texto em string e retorna um array contendo instâncias válidas de Skill
  parseFromSection(transpositionText: string): Skill[];
}
