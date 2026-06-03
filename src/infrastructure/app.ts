import express from "express";
import { RefineDraftUseCase } from "@/application/refinement/use-cases/refine-draft.use-case.js";
import { GroqLlamaService } from "@/infrastructure/ai/groq-llama.service.js";
import { RefineNoteController } from "@/infrastructure/web/controllers/refine-note.controller.js";

const app = express();
app.use(express.json());

const service = new GroqLlamaService();
const useCase = new RefineDraftUseCase(service);
const controller = new RefineNoteController(useCase);

app.post("/api/v1/notes/refine", controller.handle);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "up" });
});

export { app };
