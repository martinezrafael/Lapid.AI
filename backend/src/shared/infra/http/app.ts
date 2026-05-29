import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { z } from "zod";
import { env } from "../../../config/env.js";
import { routes } from "./routes.js";
import { errorMap } from "../../../modules/notes/infra/http/validationErrors.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  }),
);

app.use(express.json());

// Injeta o prefixo global da versão da API REST
app.use("/api/v1", routes);

// Middleware Global de Tratamento de Erros e Exceções (Error Handler)
app.use(
  (err: Error, req: Request, res: Response, _next: NextFunction): Response => {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        status: "validation_error",
        message: "Atributos inválidos no payload da requisição.",
        errors: err.issues.map((issue) => {
          const safePath = issue.path.map((p) => {
            if (typeof p === "number") return p;
            return String(p);
          });

          const traducao = errorMap(
            {
              code: issue.code,
              path: safePath,
              type: (issue as any).type,
              minimum: (issue as any).minimum,
              expected: (issue as any).expected,
              received: (issue as any).received,
            },
            { defaultError: issue.message },
          );

          return {
            field: safePath.join("."),
            message: traducao.message,
          };
        }),
      });
    }

    console.error("[HTTP] Exceção não tratada na aplicação:", err);

    return res.status(500).json({
      status: "error",
      message: "Erro interno no servidor.",
    });
  },
);

export { app };
