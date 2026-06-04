import { PrismaClient } from "@/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaRefinedNoteRepository } from "../prisma-refined-note.repository.js";
import { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
import { Scope } from "@/domain/refinement/value-objects/scope.vo.js";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const repository = new PrismaRefinedNoteRepository(prisma);

describe("🗄️ Driven Adapter - Prisma Integration", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.refinedNoteModel.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it("Deve persistir e recuperar com sucesso um agregado do Core Domain", async () => {
    const note = RefinedNote.create({
      id: crypto.randomUUID(),
      scope: Scope.create("cursos"),
      content: "## 📈 Transposição para o CV Mestre\n- Clean Architecture",
      suggestedFilename: "clean_arch.md",
    });

    await repository.save(note);
    const databaseNote = await repository.findById(note.id);

    expect(databaseNote).not.toBeNull();
    expect(databaseNote?.suggestedFilename).toBe("clean_arch.md");
    expect(databaseNote?.scope.value).toBe("cursos");
  });
});
