import { Router } from "express";
import { CreateNoteController } from "../../../modules/notes/infra/http/controllers/CreateNoteController.js";
import { SearchNoteController } from "../../../modules/notes/infra/http/controllers/SearchNoteController.js";
import { ensureIdempotency } from "./middlewares/idempotency.js";

export const routes = Router();

const createNoteController = new CreateNoteController();
const searchNoteController = new SearchNoteController();

routes.post("/notes", ensureIdempotency, createNoteController.handle);
routes.get("/notes", searchNoteController.handle);
