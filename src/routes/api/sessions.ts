import { Hono } from "hono";
import { db } from "../../db";
import { radacct } from "../../db/schema";
import { isNull } from "drizzle-orm";

const app = new Hono();

app.get("/", async (c) => {
  const rows = await db
    .select()
    .from(radacct)
    .where(isNull(radacct.acctstoptime))
    .orderBy(radacct.acctstarttime);
  return c.json(rows);
});

export default app;
