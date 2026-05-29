import { env } from "../../../config/env.js";
import { Redis, type RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  reconnectOnError: (err: Error) => {
    const targetError = "READONLY";
    return err.message.includes(targetError);
  },
};

export const redisClient = new Redis(env.REDIS_URL, redisOptions);

redisClient.on("connect", () => {
  console.log("[Redis] Conexão distribuída de cache estabelecida.");
});

redisClient.on("error", (err: unknown) => {
  console.error("[Redis] Erro na conexão do cache:", err);
});
