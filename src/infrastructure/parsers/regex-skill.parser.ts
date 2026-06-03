// Importa o tipo da interface SkillParser do domínio para garantir que esta classe de infraestrutura respeite o contrato estabelecido
import type { SkillParser } from "@/domain/career/services/skill-parser.interface.js";
// Importa a classe do Value Object Skill para encapsular as strings extraídas em objetos válidos de domínio
import { Skill } from "@/domain/career/value-objects/skill.vo.js";

// Declara e exporta a classe RegexSkillParser que atua como um Adapter (serviço utilitário) implementando a interface SkillParser
export class RegexSkillParser implements SkillParser {
  // Define o método público exigido pelo contrato, que aceita o texto bruto da nota e promete retornar um array de Skills
  public parseFromSection(transpositionText: string): Skill[] {
    // Aplica uma expressão regular para capturar tudo o que existe após o cabeçalho específico de transposição utilizando o modificador multilinha [\s\S]*
    const match = transpositionText.match(
      /## Transposição para o CV Mestre([\s\S]*)/,
    );
    // Cláusula de guarda: se o bloco não for encontrado ou o grupo de captura indexado [1] estiver vazio, retorna um array vazio imediatamente
    if (!match || !match[1]) return [];

    // Divide o conteúdo capturado em um array de strings separadas por quebra de linha (\n)
    const lines = match[1].split("\n");
    // Inicializa um array vazio fortemente tipado para armazenar as instâncias válidas de Skill processadas
    const skills: Skill[] = [];

    // Inicia um laço de repetição para iterar linha por linha sobre o conteúdo fatiado da seção
    for (const line of lines) {
      // Remove hífens (-), asteriscos (*) e espaços em branco utilizando regex global (/g) e em seguida limpa as extremidades da string (.trim())
      const cleanLine = line.replace(/[-\*\s]/g, "").trim();
      // Valida se, após a limpeza completa, a string resultante ainda possui caracteres significativos (comprimento maior que zero)
      if (cleanLine.length > 0) {
        // Instancia o Value Object Skill com a string higienizada e o insere no array de resultados acumulados
        skills.push(new Skill(cleanLine));
      }
    }

    // Retorna a lista de objetos de valor contendo todas as habilidades identificadas e validadas
    return skills;
  }
}
