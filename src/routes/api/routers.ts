import { Hono } from "hono";
import { db } from "../../db";
import { nas } from "../../db/schema";

const app = new Hono();

app.get("/", async (c) => {
  const rows = await db.select().from(nas).orderBy(nas.id);
  return c.json(rows);
});

function isValidNasName(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  // IPv4
  const ipv4 =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4.test(trimmed)) return true;
  // IPv6 (simplified)
  if (trimmed.includes(":")) return true;
  // Hostname (letters, digits, hyphens, dots)
  if (/^[a-zA-Z0-9.-]+$/.test(trimmed)) return true;
  return false;
}

type AddRouterBody = {
  nasname: string;
  shortname?: string;
  type?: string;
  secret: string;
};

app.post("/", async (c) => {
  let body: AddRouterBody;
  try {
    body = await c.req.json<AddRouterBody>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { nasname, shortname, type, secret } = body;

  if (!nasname || typeof nasname !== "string") {
    return c.json({ error: "nasname is required and must be a string" }, 400);
  }
  if (!secret || typeof secret !== "string") {
    return c.json({ error: "secret is required and must be a string" }, 400);
  }
  if (secret.trim().length === 0) {
    return c.json({ error: "secret cannot be empty" }, 400);
  }
  if (!isValidNasName(nasname)) {
    return c.json(
      { error: "nasname must be a valid IP address or hostname" },
      400
    );
  }

  const short = (shortname?.trim() || nasname.trim()).slice(0, 255) || nasname.trim();
  const nasType = (type?.trim() || "other").slice(0, 30) || "other";

  try {
    const [row] = await db
      .insert(nas)
      .values({
        nasname: nasname.trim(),
        shortname: short,
        type: nasType,
        secret: secret.trim(),
      })
      .returning();

    return c.json(row, 201);
  } catch (e) {
    console.error("Insert NAS error:", e);
    return c.json(
      { error: "Failed to add router; duplicate or DB error" },
      500
    );
  }
});

export default app;
