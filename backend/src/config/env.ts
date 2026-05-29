import "dotenv/config";
import { z } from "zod";

const urlErrorMessage = (field: string, isConnection = false) => ({
  message: `${field} deve ser uma URL válida ${isConnection ? "de conexão" : ""}`,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(3333),

  DATABASE_URL: z.string().url(urlErrorMessage("DATABASE_URL", true)),

  REDIS_URL: z.string().url(urlErrorMessage("REDIS_URL")),

  REDIS_PASSWORD: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  RABBITMQ_URL: z.string().url(urlErrorMessage("RABBITMQ_URL")),

  GROQ_API_KEY: z
    .string()
    .min(1, "A chave API do Groq (GROQ_API_KEY) é obrigatória."),

  FRONTEND_URL: z
    .string()
    .url(urlErrorMessage("FRONTEND_URL"))
    .default("http://localhost:3000"),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(
    "❌ Erro crítico: Falha na validação das variáveis de ambiente.",
  );

  parseResult.error.issues.forEach((issue) => {
    const fieldPath = issue.path.join(".");
    console.error(`- Campo [${fieldPath}]: ${issue.message}`);
  });

  throw new Error("Variáveis de ambiente inválidas");
}

export const env = parseResult.data;
