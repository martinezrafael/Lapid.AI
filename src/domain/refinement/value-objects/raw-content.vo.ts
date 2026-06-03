// Declara e exporta a classe RawContent, outro Value Object para encapsular o conteúdo bruto recebido
export class RawContent {
  // Construtor privado para bloquear o 'new'. Declara e inicializa diretamente a propriedade pública e imutável 'text'
  private constructor(public readonly text: string) {}

  // Método de fábrica estático para validar e instanciar o RawContent
  public static create(text: string): RawContent {
    // Verifica se o texto é nulo/indefinido OU se, após remover os espaços em branco nas pontas (.trim()), o tamanho é zero
    if (!text || text.trim().length === 0) {
      // Lança um erro se a validação falhar (o conteúdo bruto não pode ser vazio)
      throw new Error(
        "Invariante Violada: O rascunho de entrada não pode ser vazio.",
      );
    }
    // Retorna a nova instância válida de RawContent com o texto fornecido
    return new RawContent(text);
  }
}
