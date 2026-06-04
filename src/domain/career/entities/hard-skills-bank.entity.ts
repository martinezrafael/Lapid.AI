import type { Skill } from "../value-objects/skill.vo.js";

export class HardSkillsBank {
  private constructor(
    private rawSegment: string,
    private readonly startAnchor: string,
    private readonly endAnchor: string,
  ) {}

  public static load(fullContent: string): HardSkillsBank {
    const startAnchor = "## 🧰 Banco de Hard Skills & Tecnologias";
    const endAnchor = "## 🧠 Visão de Negócios";

    const startIndex = fullContent.indexOf(startAnchor);
    const endIndex = fullContent.indexOf(endAnchor);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error(
        "Invariante Violada: Âncoras do Banco de Hard Skills corrompidas.",
      );
    }

    const rawSegment = fullContent.substring(
      startIndex + startAnchor.length,
      endIndex,
    );
    return new HardSkillsBank(rawSegment, startAnchor, endAnchor);
  }

  public synchronizeSkills(newSkills: Skill[]): string {
    let updatedSegment = this.rawSegment;

    for (const skill of newSkills) {
      if (!this.rawSegment.toLowerCase().includes(skill.name.toLowerCase())) {
        updatedSegment += `\n- **Habilidade Adicionada:** ${skill.name}`;
      }
    }
    this.rawSegment = updatedSegment;
    return this.rawSegment;
  }
}
