import amqp from "amqplib";
import { env } from "../../../config/env.js";

export let rabbitConnection: Awaited<ReturnType<typeof amqp.connect>>;
export let rabbitChannel: Awaited<
  ReturnType<typeof rabbitConnection.createChannel>
>;

export const MESSAGING_CONFIG = {
  EXCHANGE: "lapid.notes.exchange",
  ROUTING_KEY: "note.refine",
  QUEUE: "lapid.notes.queue.refine",
  DLX: "lapid.notes.dlx",
  DLQ: "lapid.notes.queue.refine.dlq",
};

export async function inicializarRabbitMQ(): Promise<void> {
  try {
    rabbitConnection = await amqp.connect(env.RABBITMQ_URL);
    rabbitChannel = await rabbitConnection.createChannel();

    await rabbitChannel.assertExchange(MESSAGING_CONFIG.DLX, "direct", {
      durable: true,
    });
    await rabbitChannel.assertQueue(MESSAGING_CONFIG.DLQ, { durable: true });
    await rabbitChannel.bindQueue(
      MESSAGING_CONFIG.DLQ,
      MESSAGING_CONFIG.DLX,
      "failed",
    );

    await rabbitChannel.assertExchange(MESSAGING_CONFIG.EXCHANGE, "topic", {
      durable: true,
    });

    await rabbitChannel.assertQueue(MESSAGING_CONFIG.QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": MESSAGING_CONFIG.DLX,
        "x-dead-letter-routing-key": "failed",
      },
    });

    await rabbitChannel.bindQueue(
      MESSAGING_CONFIG.QUEUE,
      MESSAGING_CONFIG.EXCHANGE,
      MESSAGING_CONFIG.ROUTING_KEY,
    );

    console.log(
      "[RabbitMQ] Topologia AMQP declarada (Exchange, Queue e DLQ prontas).",
    );
  } catch (error) {
    console.error(
      "[RabbitMQ] Falha crítica ao inicializar topologia AMQP:",
      error,
    );
    throw error;
  }
}
