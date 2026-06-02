import express from "express";
import supertest from "supertest";

const app = express();
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

describe("Healthcheck Endpoint", () => {
  it("Deve retornar status UP e código HTTP 200", async () => {
    const response = await supertest(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("UP");
  });
});
