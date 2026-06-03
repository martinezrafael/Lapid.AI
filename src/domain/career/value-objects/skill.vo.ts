// Declara e exporta a classe Skill, que funciona como um Value Object (Objeto de Valor) do domínio
export class Skill {
  // O construtor declara e inicializa de forma compacta a propriedade pública e imutável 'name'
  constructor(public readonly name: string) {
    // Cláusula de guarda: verifica se o nome é nulo/indefinido OU se está vazio após a remoção de espaços em branco (.trim())
    if (!name || name.trim().length === 0) {
      // Lança um erro de validação caso a invariante de criação da habilidade seja violada
      throw new Error("Habilidade inválida");
    }
  }

  // Método público para comparar a igualdade estrutural profunda entre esta instância e outra habilidade externa
  public equals(other: Skill): boolean {
    // Retorna true se os nomes normalizados (em minúsculas e sem espaços nas pontas) forem idênticos, garantindo comparação estrutural pura
    return this.name.toLowerCase().trim() === other.name.toLowerCase().trim();
  }
}
