// Importa a entidade RefinedNote do domínio mapeado para ser utilizada na montagem dos payloads de teste
import { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
// Importa a classe MasterCV para instanciar e testar as regras de negócio do agregado
import { MasterCV } from "../entities/master-cv.entity.js";
// Importa a interface do serviço de parse para criar uma implementação simulada (stub) estável
import type { SkillParser } from "../services/skill-parser.interface.js";
// Importa o Value Object Skill para alimentar os retornos fictícios do parser nos testes
import { Skill } from "../value-objects/skill.vo.js";
// Importa o Value Object Scope para cumprir o contrato de instanciação obrigatório da nota refinada
import { Scope } from "@/domain/refinement/value-objects/scope.vo.js";

// Agrupa a suíte de testes unitários focada nas Regras de Negócio do Contexto de Currículo Profissional
describe("💼 Career Portfolio Context - Business Rules Tests", () => {
  // Cria uma implementação estática fictícia (Stub) de SkillParser com comportamento controlado para isolar os testes
  const dummyParser: SkillParser = {
    // Define que o método sempre retornará uma lista contendo exatamente duas instâncias fixas de Skill: "Docker" e "Domain-Driven Design (DDD)"
    parseFromSection: () => [
      new Skill("Docker"),
      new Skill("Domain-Driven Design (DDD)"),
    ],
  };

  // Define uma constante string contendo a estrutura válida e mínima de um Markdown de currículo com as âncoras esperadas
  const baseCVText = `# Currículo Mestre\n## 🧰 Banco de Hard Skills & Tecnologias\n- **Arquitetura & Engenharia:** Node.js\n## 🧠 Visão de Negócios`;

  // Define um caso de teste para garantir o disparo de erro quando o bloco delimitador essencial de transposição estiver ausente
  it("Deve lançar exceção se a nota refinada não possuir o bloco delimitador de transposição", () => {
    // Instancia uma entidade de currículo mestre utilizando o texto base padrão do teste
    const cv = MasterCV.create("id-1", baseCVText);
    // Cria uma nota refinada simulada com conteúdo textual inválido (que viola o método .hasTranspositionSection())
    const invalidNote = RefinedNote.create({
      id: "2",
      scope: Scope.create("cursos"),
      suggestedFilename: "x.md",
      content: "# Conteúdo sem bloco de transposição",
    });

    // Assere que tentar injetar habilidades de uma nota inválida deve obrigatoriamente estourar um erro contendo o nome da exceção esperada
    expect(() => cv.injectSkillsFrom(invalidNote, dummyParser)).toThrow(
      "MissingTranspositionSectionException",
    );
  });

  // Define um caso de teste para validar a injeção correta de itens inéditos e a proteção contra duplicidade (idempotência)
  it("Deve injetar habilidades de forma correta e sem duplicidade (Idempotência)", () => {
    // Cria uma nova instância controlada do currículo mestre para este cenário isolado
    const cv = MasterCV.create("id-1", baseCVText);
    // Cria uma nota refinada legítima que possui o padrão Markdown com o emoji e título exigido pela regra de negócio da nota
    const validNote = RefinedNote.create({
      id: "2",
      scope: Scope.create("cursos"),
      suggestedFilename: "x.md",
      content: "## Transposição para o CV Mestre\n- Docker",
    });

    // Injeção primária: Executa o método de injeção pela primeira vez
    cv.injectSkillsFrom(validNote, dummyParser);
    // Assere que o conteúdo atual do currículo foi modificado e agora contempla com sucesso a palavra "Docker"
    expect(cv.getContent()).toContain("Docker");

    // Armazena em uma variável o tamanho total da string do currículo após a primeira rodada bem-sucedida
    const totalLengthAfterFirstRun = cv.getContent().length;

    // Segunda injeção idêntica: Tenta injetar os mesmos dados da mesma nota novamente
    cv.injectSkillsFrom(validNote, dummyParser);
    // Assere que o tamanho da string final do currículo permanece idêntico ao da primeira rodada, provando a idempotência da operação
    expect(cv.getContent().length).toBe(totalLengthAfterFirstRun);
  });
});
