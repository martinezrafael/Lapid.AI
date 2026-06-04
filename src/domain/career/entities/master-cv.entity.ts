import type { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
import type { SkillParser } from "../services/skill-parser.interface.js";
import { HardSkillsBank } from "./hard-skills-bank.entity.js";

export class MasterCV {
  private constructor(
    public readonly id: string,
    private content: string,
  ) {}

  public static create(id: string, content: string): MasterCV {
    return new MasterCV(id, content);
  }

  public getContent(): string {
    return this.content;
  }

  public injectSkillsFrom(refinedNote: RefinedNote, parser: SkillParser): void {
    if (!refinedNote.hasTranspositionSection()) {
      throw new Error(
        "MissingTranspositionSectionException: Operação abortada.",
      );
    }

    const newSkills = parser.parseFromSection(refinedNote.content);
    if (newSkills.length === 0) return;

    const bank = HardSkillsBank.load(this.content);
    const startAnchor = "## 🧰 Banco de Hard Skills & Tecnologias";
    const endAnchor = "## 🧠 Visão de Negócios";

    const startIndex = this.content.indexOf(startAnchor);
    const endIndex = this.content.indexOf(endAnchor);

    const synchronizedSegment = bank.synchronizeSkills(newSkills);

    this.content =
      this.content.substring(0, startIndex + startAnchor.length) +
      synchronizedSegment +
      this.content.substring(endIndex);
  }
}
