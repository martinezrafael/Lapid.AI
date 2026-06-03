// Importa a classe RawContent do caminho mapeado para realizar os testes unitários
import { RawContent } from "@/domain/refinement/value-objects/raw-content.vo.js";
// Importa a classe RefinedNote do caminho mapeado para realizar os testes unitários
import { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
// Importa a classe Scope do caminho mapeado para realizar os testes unitários
import { Scope } from "@/domain/refinement/value-objects/scope.vo.js";

// Agrupa uma suíte de testes relacionados ao Contexto de Refinamento (Testes Táticos de Domínio)
describe("Refinement Context - Tactical Domain Tests", () => {
  // Define o primeiro teste unitário focado na rejeição de escopos inválidos
  it("Deve rejeitar escopos não homologados pela regra de negócio", () => {
    // Assere que tentar criar um Scope com o valor "invalido" deve disparar um erro contendo a mensagem especificada
    expect(() => Scope.create("invalido")).toThrow(
      "O escopo 'invalido' é inválido.",
    );
  });

  // Define o segundo teste focado no fluxo de sucesso da criação de escopos
  it("Deve aceitar escopos válidos", () => {
    // Cria uma instância válida do Scope usando o termo homologado "cursos"
    const scope = Scope.create("cursos");
    // Assere que a propriedade internalizada 'value' é exatamente igual a "cursos"
    expect(scope.value).toBe("cursos");
  });

  // Define o terceiro teste focado na validação de conteúdo bruto vazio
  it("Deve invalidar rascunhos de conteúdo vazios", () => {
    // Assere que tentar criar um RawContent com uma string vazia deve estourar qualquer tipo de erro/exceção
    expect(() => RawContent.create("")).toThrow();
  });

  // Define o quarto teste focado no método de validação da seção obrigatória na entidade RefinedNote
  it("Deve validar corretamente a existência da seção de transposição obrigatória", () => {
    // Cria uma instância de nota simulando um cenário válido (Nota: Aqui há um detalhe, a string do conteúdo não possui o emoji '📈' que a classe busca)
    const validNote = RefinedNote.create({
      id: "1",
      scope: Scope.create("cursos"),
      suggestedFilename: "teste.md",
      content: "## Transposição para o CV Mestre\n- Competência Extraída",
    });

    // Cria uma instância de nota simulando um cenário explicitamente inválido (sem a estrutura do cabeçalho)
    const invalidNote = RefinedNote.create({
      id: "2",
      scope: Scope.create("cursos"),
      suggestedFilename: "teste.md",
      content: "# Nota sem secao de transposição",
    });

    // Assere que o método hasTranspositionSection deveria retornar true para a nota categorizada como válida
    expect(validNote.hasTranspositionSection()).toBe(true);
    // Assere que o método hasTranspositionSection deve retornar false para a nota categorizada como inválida
    expect(invalidNote.hasTranspositionSection()).toBe(false);
  });
});
