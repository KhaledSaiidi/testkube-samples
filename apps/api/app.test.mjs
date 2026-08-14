import request from "supertest";
import { test } from "vitest";
import { app } from "./index.mjs";

test("Responds with a welcome message", async () => {
  await request(app)
    .get("/api/hello")
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(200);
});
