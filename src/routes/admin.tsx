import { Hono } from "hono";

const app = new Hono();

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captive Portal - Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; background: #f5f5f5; padding: 1rem; }
    h1 { margin: 0 0 1rem 0; font-size: 1.5rem; }
    section { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 1.25rem; margin-bottom: 1rem; max-width: 900px; }
    section h2 { margin: 0 0 0.75rem 0; font-size: 1.1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #333; }
    form { display: grid; grid-template-columns: 1fr 1fr auto auto auto; gap: 0.5rem; align-items: end; flex-wrap: wrap; }
    form label { display: block; font-size: 0.75rem; color: #666; margin-bottom: 0.25rem; }
    form input { padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.875rem; }
    form button { padding: 0.5rem 1rem; background: #333; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
    form button:hover { background: #555; }
    .msg { padding: 0.5rem 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .msg.err { background: #fee; color: #c00; }
    .msg.ok { background: #efe; color: #060; }
    .loading { color: #666; }
  </style>
</head>
<body>
  <h1>Captive Portal Admin</h1>
  <section>
    <h2>Add router (NAS)</h2>
    <div id="form-msg"></div>
    <form id="add-router-form">
      <div>
        <label for="nasname">NAS IP / hostname</label>
        <input id="nasname" name="nasname" required placeholder="192.168.1.1">
      </div>
      <div>
        <label for="shortname">Short name</label>
        <input id="shortname" name="shortname" placeholder="optional">
      </div>
      <div>
        <label for="secret">Secret</label>
        <input id="secret" name="secret" type="password" required placeholder="RADIUS secret">
      </div>
      <div>
        <label for="type">Type</label>
        <input id="type" name="type" placeholder="other">
      </div>
      <div>
        <button type="submit">Add</button>
      </div>
    </form>
  </section>
  <section>
    <h2>Routers (NAS)</h2>
    <div id="routers-loading" class="loading">Loading…</div>
    <table id="routers-table" style="display: none;">
      <thead><tr><th>ID</th><th>NAS name</th><th>Short name</th><th>Type</th></tr></thead>
      <tbody id="routers-body"></tbody>
    </table>
  </section>
  <section>
    <h2>Active sessions</h2>
    <div id="sessions-loading" class="loading">Loading…</div>
    <table id="sessions-table" style="display: none;">
      <thead><tr><th>Username</th><th>NAS IP</th><th>Start</th><th>Session ID</th></tr></thead>
      <tbody id="sessions-body"></tbody>
    </table>
  </section>
  <script>
    const form = document.getElementById('add-router-form');
    const formMsg = document.getElementById('form-msg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formMsg.textContent = '';
      formMsg.className = '';
      const fd = new FormData(form);
      const body = {
        nasname: fd.get('nasname'),
        shortname: fd.get('shortname') || undefined,
        type: fd.get('type') || undefined,
        secret: fd.get('secret')
      };
      try {
        const r = await fetch('/api/routers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          formMsg.textContent = data.error || 'Failed to add router';
          formMsg.className = 'msg err';
          return;
        }
        formMsg.textContent = 'Router added.';
        formMsg.className = 'msg ok';
        form.reset();
        loadRouters();
      } catch (err) {
        formMsg.textContent = err.message || 'Request failed';
        formMsg.className = 'msg err';
      }
    });

    function renderRouters(list) {
      const loading = document.getElementById('routers-loading');
      const table = document.getElementById('routers-table');
      const body = document.getElementById('routers-body');
      loading.style.display = 'none';
      table.style.display = 'table';
      body.innerHTML = list.length === 0 ? '<tr><td colspan="4">No routers</td></tr>' : list.map(r => 
        '<tr><td>' + r.id + '</td><td>' + escapeHtml(r.nasname) + '</td><td>' + escapeHtml(r.shortname) + '</td><td>' + escapeHtml(r.type || '') + '</td></tr>'
      ).join('');
    }

    function renderSessions(list) {
      const loading = document.getElementById('sessions-loading');
      const table = document.getElementById('sessions-table');
      const body = document.getElementById('sessions-body');
      loading.style.display = 'none';
      table.style.display = 'table';
      const fmt = (d) => d ? new Date(d).toLocaleString() : '-';
      body.innerHTML = list.length === 0 ? '<tr><td colspan="4">No active sessions</td></tr>' : list.map(s =>
        '<tr><td>' + escapeHtml(s.username || '-') + '</td><td>' + escapeHtml(String(s.nasipaddress || '-')) + '</td><td>' + fmt(s.acctstarttime) + '</td><td>' + escapeHtml(s.acctsessionid || '-') + '</td></tr>'
      ).join('');
    }

    function escapeHtml(s) {
      const div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }

    async function loadRouters() {
      try {
        const r = await fetch('/api/routers');
        const data = await r.json();
        renderRouters(Array.isArray(data) ? data : []);
      } catch {
        renderRouters([]);
      }
    }

    async function loadSessions() {
      try {
        const r = await fetch('/api/sessions');
        const data = await r.json();
        renderSessions(Array.isArray(data) ? data : []);
      } catch {
        renderSessions([]);
      }
    }

    loadRouters();
    loadSessions();
  </script>
</body>
</html>
`;

app.get("/", (c) => c.html(ADMIN_HTML));

export default app;
