// Importa o tipo da entidade RefinedNote utilizando o alias mapeado para fins de tipagem estática
import type { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
// Importa a interface do serviço SkillParser apenas como tipo para viabilizar a injeção do contrato
import type { SkillParser } from "../services/skill-parser.interface.js";

// Declara e exporta a classe MasterCV, que funciona como uma Entidade/Raiz de Agregado do domínio
export class MasterCV {
  // Construtor privado para impedir o uso direto de 'new MasterCV()'. Inicializa propriedades públicas e privadas
  private constructor(
    public readonly id: string, // Identificador único e imutável do currículo mestre
    private content: string, // Conteúdo textual mutável e encapsulado do arquivo de currículo
  ) {}

  // Método de fábrica estático para encapsular a criação controlada de novas instâncias de MasterCV
  public static create(id: string, content: string): MasterCV {
    // Retorna uma nova instância da classe repassando os parâmetros ao construtor privado
    return new MasterCV(id, content);
  }

  // Método público getter simulado (método de leitura) para expor de forma segura o conteúdo textual privado
  public getContent(): string {
    return this.content;
  }

  // Método de comportamento de negócio que analisa uma nota refinada e injeta competências não mapeadas no currículo
  public injectSkillsFrom(refinedNote: RefinedNote, parser: SkillParser): void {
    // 1. Cláusula de Guarda da Injeção: Verifica se a nota não possui o cabeçalho obrigatório de transposição
    if (!refinedNote.hasTranspositionSection()) {
      // Aborta a execução lançando uma exceção de negócio caso o bloco delimitador esteja ausente na nota
      throw new Error(
        "MissingTranspositionSectionException: Operação abortada.",
      );
    }

    // 2. Extração via Domain Service Contract: Delega o parse do texto ao serviço de infraestrutura abstraído pela interface
    const newSkills = parser.parseFromSection(refinedNote.content);
    // Cláusula de guarda secundária: se o parser não extrair nenhuma habilidade do texto, o fluxo é encerrado prematuramente
    if (newSkills.length === 0) return;

    // 3. Localização das Âncoras Fixas no Texto: Define a string que marca o início da seção de hard skills no Markdown
    const startAnchor = "## 🧰 Banco de Hard Skills & Tecnologias";
    // Define a string que marca o fim da seção de habilidades e o início da próxima seção do currículo
    const endAnchor = "## 🧠 Visão de Negócios";

    // Procura a posição exata em caracteres onde se inicia a string de abertura no conteúdo global
    const startIndex = this.content.indexOf(startAnchor);
    // Procura a posição exata em caracteres onde se inicia a string de fechamento no conteúdo global
    const endIndex = this.content.indexOf(endAnchor);

    // Verifica se alguma das âncoras estruturais de formatação do Markdown não foi localizada no texto (-1)
    if (startIndex === -1 || endIndex === -1) {
      // Lança um erro crítico indicando que o layout ou integridade do documento do currículo está corrompido
      throw new Error(
        "Invariante do Portfólio Corrompida: Âncoras estruturais ausentes.",
      );
    }

    // Isola o segmento de texto contido exclusivamente entre o final da âncora inicial e o começo da âncora final
    const currentBankSegment = this.content.substring(
      startIndex + startAnchor.length, // Avança o ponteiro pulando o tamanho do próprio texto da âncora de início
      endIndex, // Delimita o final do recorte até o índice onde começa o bloco de negócios
    );

    // 4. Sincronização Idempotente da Stack Técnica (Evita duplicados): Inicializa uma variável temporária com o trecho isolado
    let updatedSegment = currentBankSegment;
    // Varre em um laço de repetição cada uma das habilidades extraídas pelo parser externo
    for (const skill of newSkills) {
      // Verifica se o segmento atual do currículo (em minúsculas) NÃO inclui o nome da habilidade analisada (em minúsculas)
      if (
        !currentBankSegment.toLowerCase().includes(skill.name.toLowerCase())
      ) {
        // Concatena a nova habilidade formatada em Markdown no final do segmento temporário caso ela seja inédita
        updatedSegment += `\n- **Habilidade Adicionada:** ${skill.name}`;
      }
    }

    // Recompõe o arquivo do portfólio de forma controlada substituindo o bloco antigo pelo bloco de dados sincronizado e atualizado
    this.content =
      this.content.substring(0, startIndex + startAnchor.length) + // Parte 1: Todo o texto antes do miolo das competências (incluindo a âncora de início)
      updatedSegment + // Parte 2: O segmento contendo as habilidades antigas mais as novas adicionadas
      this.content.substring(endIndex); // Parte 3: Todo o restante do currículo que vem após a âncora de fechamento
  }
}
