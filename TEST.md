# Testing the Captive Portal + FreeRADIUS Setup

## 1. Expose DB (if not already)

If you added `ports: - "5432:5432"` to the `db` service, run:

```bash
docker compose up -d db
```

If port 5432 is already in use on your machine, change it (e.g. `"5433:5432"`) and use that port in `DATABASE_URL` below.

---

## 2. Add a test RADIUS user

FreeRADIUS authenticates against the `radcheck` table. Add a user so we can test auth:

```bash
docker exec -it radius_db psql -U radius -d radius_db -c "
  INSERT INTO radcheck (username, attribute, op, value)
  VALUES ('testuser', 'Cleartext-Password', '==', 'testpass')
  ON CONFLICT DO NOTHING;
"
```

(Use a different username/password if you prefer.)

---

## 3. Test FreeRADIUS with radtest

If you have `radtest` (often from package `freeradius-utils` or similar):

```bash
# macOS: brew install freeradius-server  (includes radtest)
# Linux: apt install freeradius-utils  or  yum install freeradius-utils

radtest testuser testpass 127.0.0.1 0 testing123
```

- **Username:** testuser  
- **Password:** testpass  
- **Server:** 127.0.0.1  
- **Port:** 0 means use default 1812  
- **Secret:** testing123 (from `radius_config/clients.conf` for client `localhost`)

You should see `Access-Accept` if the DB and SQL module are working.

---

## 4. Test the Bun app (Admin + API + Login)

Start the app (from the project root):

```bash
export DATABASE_URL="postgresql://radius:your_password@127.0.0.1:5432/radius_db"
bun run index.ts
```

Then in the browser or with curl:

| What | URL / Command |
|------|----------------|
| Admin dashboard | http://localhost:3000/admin |
| List routers (API) | `curl http://localhost:3000/api/routers` |
| Add a router (API) | `curl -X POST http://localhost:3000/api/routers -H "Content-Type: application/json" -d '{"nasname":"192.168.1.1","secret":"mysecret"}'` |
| Captive portal login page | http://localhost:3000/login |

Login form: use the same `testuser` / `testpass` (they’re checked against `radcheck`).

---

## 5. Quick recap

- **RADIUS:** radtest with testuser/testpass → Access-Accept.  
- **App:** DATABASE_URL to Postgres, then hit /admin, /api/routers, /login.
