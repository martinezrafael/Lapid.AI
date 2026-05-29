import { env } from "../../../config/env.js";
import { db } from "../database/postgres.js";
import { redisClient } from "../cache/redis.js";
import {
  inicializarRabbitMQ,
  rabbitConnection,
} from "../messaging/rabbitmq.js";
import { app } from "./app.js";

async function bootstrap() {
  try {
    console.log("[Lapid.AI] Inicializando microsserviço de API HTTP...");

    await db.raw("SELECT 1 AS database_ready");
    console.log("[PostgreSQL] Pool de conexões ativo.");

    await inicializarRabbitMQ();

    const server = app.listen(env.PORT, () => {
      console.log(
        `[HTTP] Servidor Lapid.AI escutando estavelmente na porta ${env.PORT}`,
      );
    });

    const handleGracefulShutdown = async (signal: string) => {
      console.log(
        `\n [HTTP] Sinal ${signal} recebido. Encerrando conexões de forma segura...`,
      );

      server.close(async (err) => {
        if (err) {
          console.error("[HTTP] Erro ao fechar servidor:", err);
          process.exit(1);
        }

        try {
          console.log("[Database] Fechando pool do PostgreSQL...");
          await db.destroy();

          console.log("[Cache] Desconectando cliente Redis...");
          await redisClient.quit();

          console.log("[RabbitMQ] Fechando canais e conexões AMQP...");
          if (rabbitConnection) await rabbitConnection.close();

          console.log(
            "[HTTP] Shutdown finalizado com sucesso. Encerrando processo.",
          );
          process.exit(0);
        } catch (error) {
          console.error("[HTTP] Erro durante a limpeza de recursos:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error(
          "[HTTP] Timeout atingido. Forçando encerramento do processo.",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("[Bootstrap] Erro fatal na inicialização da API:", error);
    process.exit(1);
  }
}

bootstrap();
