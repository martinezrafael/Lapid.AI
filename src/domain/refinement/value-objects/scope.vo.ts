// Declara e exporta a classe Scope, que funciona como um Value Object (Objeto de Valor) no DDD
export class Scope {
  // Define uma lista estática e privada de escopos permitidos (regra de negócio), acessível apenas dentro da classe e imutável (readonly)
  private static readonly VALID_SCOPES = ["cursos", "trabalho", "projetos"];

  // Construtor privado para impedir a instanciação direta com 'new Scope()'. Usa atalho do TS para declarar e inicializar a propriedade pública e imutável 'value'
  private constructor(public readonly value: string) {}

  // Método de fábrica estático para criar instâncias controladas e validadas da classe Scope
  public static create(value: string): Scope {
    // Verifica se o valor é nulo/vazio OU se o valor (em minúsculas) NÃO está incluso na lista de escopos válidos
    if (!value || !this.VALID_SCOPES.includes(value.toLowerCase())) {
      // Lança um erro caso o escopo fornecido viole a regra de negócio estabelecida
      throw new Error(`Invariante Violada: O escopo '${value}' é inválido.`);
    }
    // Retorna uma nova instância de Scope com o valor padronizado em letras minúsculas
    return new Scope(value.toLowerCase());
  }
}
