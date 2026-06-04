import { HardSkillsBank } from "../entities/hard-skills-bank.entity.js";

describe("🧠 Tactical Domain - HardSkillsBank Local Entity", () => {
  it("Deve estourar erro de domínio se o documento Markdown não possuir as âncoras de marcação", () => {
    const invalidMarkdown = "# Currículo Sem Âncoras";
    expect(() => HardSkillsBank.load(invalidMarkdown)).toThrow(
      "Âncoras do Banco de Hard Skills corrompidas.",
    );
  });
});
