import http from "http";
import express from "express";
import pg from "pg";
import GracefulShutdown from "http-graceful-shutdown";
import cors from "cors";

const PORT = 8080;

export const app = express();
app.use(cors());

app.get("/api/hello", (request, response) => {
  console.log("GET /api/hello");
  const name = request.query?.name;
  console.log("Test", name);
  return response.json({ message: `hello, ${name ?? "world"}` });
});

app.get("/api/hello-pg", async (_, response) => {
  try {
    console.log("GET /api/hello-pg");

    const databaseUrl = process.env["DATABASE_URL"];
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required");
    }

    const client = new pg.Client({
      connectionString: databaseUrl,
    });
    await client.connect();

    const res = await client.query("SELECT $1::text as message", [
      "hello world from postgres",
    ]);
    const message = res.rows[0].message;

    await client.end();

    response.json({ message });
  } catch (err) {
    console.log("GET /api/hello-pg failed", err.message);
    return response.status(503).json({ message: "database unavailable" });
  }
});

GracefulShutdown(app);

http.createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 server running on localhost:8080`);
});
