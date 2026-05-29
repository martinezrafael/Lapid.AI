import type { Request, Response } from "express";
import { z } from "zod";
import type { Knex } from "knex";
import { db } from "../../../../../shared/infra/database/postgres.js";

const SearchNoteSchema = z.object({
  q: z.string().max(100, "Termo de busca excessivamente longo").optional(),
  status: z.enum(["PROCESSING", "PROCESSED", "FAILED"]).optional(),
  flow_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(5),
});

export class SearchNoteController {
  async handle(req: Request, res: Response): Promise<Response> {
    const parsedQuery = SearchNoteSchema.parse(req.query);
    const offset = (parsedQuery.page - 1) * parsedQuery.limit;

    const dataQuery = db("notes").distinct("notes.*");
    const countQuery = db("notes")
      .count<{ count: string | number }>("notes.id as count")
      .first();

    const applyFilters = (queryBuilder: Knex.QueryBuilder) => {
      if (parsedQuery.flow_id) {
        queryBuilder.where("notes.flow_id", parsedQuery.flow_id);
      }

      if (parsedQuery.status) {
        queryBuilder.where("notes.status", parsedQuery.status);
      }

      if (parsedQuery.q) {
        queryBuilder.where((builder: Knex.QueryBuilder) =>
          builder
            .whereILike("notes.title", `%${parsedQuery.q}%`)
            .orWhereILike("notes.raw_content", `%${parsedQuery.q}%`)
            .orWhereILike("notes.slug", `%${parsedQuery.q}%`),
        );
      }
    };

    applyFilters(dataQuery);
    applyFilters(countQuery as unknown as Knex.QueryBuilder);

    const [notes, totalCountResult] = await Promise.all([
      dataQuery
        .limit(parsedQuery.limit)
        .offset(offset)
        .orderBy("notes.created_at", "desc"),
      countQuery,
    ]);

    const totalItems = Number(totalCountResult?.count || 0);
    const totalPages = Math.ceil(totalItems / parsedQuery.limit);

    return res.status(200).json({
      data: notes,
      meta: {
        totalItems,
        totalPages,
        currentPage: parsedQuery.page,
        itemsPerPage: parsedQuery.limit,
      },
    });
  }
}
