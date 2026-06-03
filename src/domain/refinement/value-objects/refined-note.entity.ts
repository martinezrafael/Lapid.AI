// Importa o Value Object Scope para ser utilizado na composição das propriedades da nota refinada
import { Scope } from "../value-objects/scope.vo.js";

// Define a interface que dita a estrutura e os tipos de dados necessários para criar uma nota refinada
export interface RefinedNoteProps {
  id: string; // Identificador único da nota
  scope: Scope; // Instância do Value Object Scope
  content: string; // Conteúdo textual da nota
  suggestedFilename: string; // Nome de arquivo sugerido para a nota
}

// Declara e exporta a classe RefinedNote, que atua como uma Entidade dentro do domínio
export class RefinedNote {
  // Construtor privado que recebe e armazena todas as propriedades estruturadas na interface RefinedNoteProps
  private constructor(private props: RefinedNoteProps) {}

  // Método de fábrica estático para criar uma nova instância da Entidade RefinedNote
  public static create(props: RefinedNoteProps): RefinedNote {
    // Retorna a instância da classe passando as propriedades para o construtor privado
    return new RefinedNote(props);
  }

  // Método getter público para expor de forma segura o ID encapsulado no objeto de propriedades
  get id(): string {
    return this.props.id;
  }
  // Método getter público para expor o Scope encapsulado
  get scope(): Scope {
    return this.props.scope;
  }
  // Método getter público para expor o conteúdo de texto encapsulado
  get content(): string {
    return this.props.content;
  }
  // Método getter público para expor o nome de arquivo sugerido encapsulado
  get suggestedFilename(): string {
    return this.props.suggestedFilename;
  }

  // Método de comportamento da entidade que verifica se o conteúdo possui uma seção específica de transposição
  public hasTranspositionSection(): boolean {
    // Retorna um booleano indicando se a string exata do cabeçalho Markdown está presente no conteúdo
    return this.props.content.includes("## Transposição para o CV Mestre");
  }
}
