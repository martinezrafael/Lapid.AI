import type { Request, Response } from "express";
import { db } from "../../../../../shared/infra/database/postgres.js";
import {
  MESSAGING_CONFIG,
  rabbitChannel,
} from "../../../../../shared/infra/messaging/rabbitmq.js";
import { CreateNoteSchema } from "../../../dtos/CreateNoteDTO.js";
import { redisClient } from "../../../../../shared/infra/cache/redis.js";

export class CreateNoteController {
  async handle(req: Request, res: Response): Promise<Response> {
    const productData = CreateNoteSchema.parse(req.body);

    const httpResponse = await db.transaction(async (trx) => {
      // Garante de forma síncrona que o fluxo operacional existe na tabela flows
      const flow = await trx("flows")
        .where({ id: productData.flow_id })
        .first();
      if (!flow) {
        throw new Error(
          "O fluxo de automação operacional informado não existe.",
        );
      }

      const [note] = await trx("notes")
        .insert({
          title: productData.title,
          slug: `pending_lapid_${Math.random().toString(36).substring(7)}`,
          flow_id: productData.flow_id,
          raw_content: productData.raw_content,
          attributes: JSON.stringify(productData.attributes || {}),
          status: "PROCESSING",
        })
        .returning("*");

      const messagePayload = {
        noteId: note.id,
        configJson: flow.config_json_name,
      };

      rabbitChannel.publish(
        MESSAGING_CONFIG.EXCHANGE,
        MESSAGING_CONFIG.ROUTING_KEY,
        Buffer.from(JSON.stringify(messagePayload)),
        { deliveryMode: 2 },
      );

      return { id: note.id, status: note.status };
    });

    if (req.idempotencyCacheKey) {
      await redisClient.set(
        req.idempotencyCacheKey,
        JSON.stringify({ status: 202, body: httpResponse }),
        "EX",
        300,
      );
    }

    return res.status(202).json(httpResponse);
  }
}
