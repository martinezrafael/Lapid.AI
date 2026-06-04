import type { RefinedNote } from "../value-objects/refined-note.entity.js";

export interface RefinedNoteRepository {
  save(note: RefinedNote): Promise<void>;
  findById(id: string): Promise<RefinedNote | null>;
}
