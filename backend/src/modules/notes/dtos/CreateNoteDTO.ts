import { z } from "zod";

export const CreateNoteSchema = z.object({
  title: z
    .string({ message: "O título provisório da nota é obrigatório." })
    .min(1, "O título não pode ser enviado vazio."),
  flow_id: z
    .number({ message: "O ID do fluxo operacional é obrigatório." })
    .int()
    .positive(),
  raw_content: z
    .string({ message: "O conteúdo bruto do rascunho é obrigatório." })
    .min(1, "O conteúdo bruto não pode ser enviado vazio."),
  attributes: z.record(z.string(), z.any()).default({}),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
