// Importa a classe da Entidade/Agregado MasterCV para permitir a orquestração do comportamento de negócio no fluxo
import { MasterCV } from "@/domain/career/entities/master-cv.entity.js";
// Importa o tipo da interface de serviço apenas para tipagem estática da dependência recebida no construtor
import type { SkillParser } from "@/domain/career/services/skill-parser.interface.js";
// Importa a classe da Entidade RefinedNote para viabilizar a criação do objeto necessário à injeção
import { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
// Importa a classe do Value Object Scope para que os dados primitivos de entrada HTTP passem pela validação do domínio
import { Scope } from "@/domain/refinement/value-objects/scope.vo.js";

// Define a estrutura de dados (DTO de entrada) recebida pela camada externa com os dados primitivos serializados
export interface InjectSkillInput {
  cvContent: string; // Conteúdo textual completo em string do currículo mestre atual
  refinedNoteContent: string; // Conteúdo textual bruto em string da nota que carrega as habilidades extraídas
  scope: string; // String primitiva que indica o escopo associado (ex: "cursos")
}

// Declara e exporta a classe do Caso de Uso responsável pela execução do fluxo de injeção de competências
export class InjectSkillUseCase {
  // O construtor recebe e injeta automaticamente como propriedade privada e imutável uma implementação válida do SkillParser (Inversão de Dependência)
  constructor(private readonly skillParser: SkillParser) {}

  // Define o método público e assíncrono que dita o fluxo lógico principal da funcionalidade, prometendo retornar o currículo atualizado em string
  public async execute(input: InjectSkillInput): Promise<string> {
    // Cria uma instância da Entidade MasterCV gerando um UUID dinâmico nativo e injetando o texto bruto do currículo enviado
    const masterCV = MasterCV.create(crypto.randomUUID(), input.cvContent);
    // Instancia a Entidade RefinedNote montando as propriedades necessárias a partir do DTO de entrada e forçando a validação do escopo
    const refinedNote = RefinedNote.create({
      id: crypto.randomUUID(), // Gera um identificador único universal versão 4 de forma nativa para a nota efêmera
      scope: Scope.create(input.scope), // Invoca a validação de invariantes criando o Value Object de escopo legítimo
      content: input.refinedNoteContent, // Mapeia o texto da nota bruto recebido
      suggestedFilename: "temp.md", // Atribui um nome de arquivo fixo e temporário exigido pelo contrato estrutural da entidade
    });

    // Dispara a lógica e o comportamento de domínio do agregado MasterCV passando a nota instanciada e o parser injetado
    masterCV.injectSkillsFrom(refinedNote, this.skillParser);
    // Recupera o novo estado textual interno do agregado modificado através do getter e o retorna para quem chamou o caso de uso
    return masterCV.getContent();
  }
}
