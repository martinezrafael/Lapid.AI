import type { RefinedNoteRepository } from "@/domain/refinement/repositories/refined-note.repository.interface.js";
import { RefinedNote } from "@/domain/refinement/value-objects/refined-note.entity.js";
import { Scope } from "@/domain/refinement/value-objects/scope.vo.js";
import { PrismaClient } from "@/generated/client.js";

export class PrismaRefinedNoteRepository implements RefinedNoteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async save(note: RefinedNote): Promise<void> {
    await this.prisma.refinedNoteModel.upsert({
      where: { id: note.id },
      update: {
        scope: note.scope.value,
        content: note.content,
        suggestedFilename: note.suggestedFilename,
      },
      create: {
        id: note.id,
        scope: note.scope.value,
        content: note.content,
        suggestedFilename: note.suggestedFilename,
      },
    });
  }

  public async findById(id: string): Promise<RefinedNote | null> {
    const model = await this.prisma.refinedNoteModel.findUnique({
      where: { id },
    });
    if (!model) return null;

    return RefinedNote.create({
      id: model.id,
      scope: Scope.create(model.scope),
      content: model.content,
      suggestedFilename: model.suggestedFilename,
    });
  }
}
