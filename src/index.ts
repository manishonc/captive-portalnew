import { Hono } from "hono";
import auth from "./routes/auth";
import admin from "./routes/admin";
import routers from "./routes/api/routers";
import sessions from "./routes/api/sessions";

const app = new Hono();

app.route("/login", auth);
app.route("/admin", admin);
app.route("/api/routers", routers);
app.route("/api/sessions", sessions);

app.get("/", (c) => {
  return c.redirect("/admin");
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
