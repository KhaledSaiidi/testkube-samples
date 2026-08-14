import http from "http";
import express from "express";
import pg from "pg";
import GracefulShutdown from "http-graceful-shutdown";
import cors from "cors";

const PORT = 8080;

function createDatabaseClient() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return new pg.Client({
    connectionString: databaseUrl,
  });
}

export const app = express();
app.use(cors());

app.get("/healthz", (_, response) => {
  return response.json({ status: "ok" });
});

app.get("/readyz", async (_, response) => {
  let client;

  try {
    client = createDatabaseClient();
    await client.connect();
    await client.query("SELECT 1");
    return response.json({ status: "ready" });
  } catch (err) {
    console.log("GET /readyz failed", err.message);
    return response.status(503).json({ status: "not ready" });
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (err) {
        console.log("GET /readyz cleanup failed", err.message);
      }
    }
  }
});

app.get("/api/hello", (request, response) => {
  console.log("GET /api/hello");
  const name = request.query?.name;
  console.log("Test", name);
  return response.json({ message: `hello, ${name ?? "world"}` });
});

app.get("/api/hello-pg", async (_, response) => {
  try {
    console.log("GET /api/hello-pg");

    const client = createDatabaseClient();
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
