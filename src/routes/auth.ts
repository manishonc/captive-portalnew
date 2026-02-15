import { Hono } from "hono";
import { db } from "../db";
import { sql } from "drizzle-orm";

const app = new Hono();

const LOGIN_HTML = (redirectUrl: string, error?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captive Portal - Login</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .card { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); width: 100%; max-width: 360px; }
    h1 { margin: 0 0 1.5rem 0; font-size: 1.25rem; }
    label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; color: #333; }
    input { width: 100%; padding: 0.5rem 0.75rem; margin-bottom: 1rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    button { width: 100%; padding: 0.75rem; background: #333; color: #fff; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
    button:hover { background: #555; }
    .error { color: #c00; font-size: 0.875rem; margin-bottom: 1rem; }
    .success { color: #060; font-size: 0.875rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Sign in to network</h1>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
    <form method="post" action="/login">
      <input type="hidden" name="redirect_url" value="${escapeHtml(redirectUrl)}">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" required autocomplete="username">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required autocomplete="current-password">
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>
`;

const SUCCESS_HTML = (redirectUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access granted</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .card { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    a { color: #06c; }
  </style>
</head>
<body>
  <div class="card">
    <p class="success">You are signed in.</p>
    <p><a href="${escapeHtml(redirectUrl)}">Continue to your destination</a></p>
  </div>
</body>
</html>
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validate user against radcheck (Cleartext-Password or User-Password). */
async function validateUser(username: string, password: string): Promise<boolean> {
  const rows = await db.execute(sql`
    SELECT id, attribute, value, op FROM radcheck
    WHERE username = ${username.trim()} AND attribute IN ('Cleartext-Password', 'User-Password')
    ORDER BY id LIMIT 1
  `);
  if (!rows.length) return false;
  const row = rows[0] as { attribute: string; value: string; op: string };
  if (row.op !== "==") return false;
  return row.value === password;
}

app.get("/", (c) => {
  const redirectUrl =
    (c.req.query("redirect_url") || c.req.query("url") || "").trim() ||
    "/";
  return c.html(LOGIN_HTML(redirectUrl));
});

app.post("/", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  let username: string;
  let password: string;
  let redirectUrl: string;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await c.req.parseBody();
    username = (form["username"] as string)?.trim() ?? "";
    password = (form["password"] as string) ?? "";
    redirectUrl = ((form["redirect_url"] as string) ?? "").trim() || "/";
  } else {
    return c.json({ error: "Use form POST or application/x-www-form-urlencoded" }, 400);
  }

  if (!username) {
    return c.html(LOGIN_HTML(redirectUrl, "Username is required"), 400);
  }

  const ok = await validateUser(username, password);
  if (!ok) {
    return c.html(LOGIN_HTML(redirectUrl, "Invalid username or password"), 401);
  }

  return c.html(SUCCESS_HTML(redirectUrl), 200);
});

export default app;
