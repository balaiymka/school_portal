HEAD
# School Portal — Local development with Postgres, pgAdmin4 and VS Code

This project is a small school portal frontend + Express backend. The server supports two modes:

- Postgres mode: if Postgres connection env vars are provided the server will use a Postgres Pool.
- Fallback in-memory mode: if no DB is configured the server uses in-memory sample users (good for quick dev).

This README explains how to run Postgres locally, initialize the database, connect with pgAdmin4 and VS Code, and start the server.

## Quick start (no DB)

1. Install dependencies:
   - npm install
2. Start the dev server (in-memory users):
   - npm run dev
3. Open http://localhost:5001

This runs the server in fallback mode (no Postgres required). Login with seeded accounts like `balaiym@test.com` / `123`.

## Enable Postgres (recommended for persistence)

You can run Postgres locally via Homebrew, your system package manager, or Docker. Example using Docker:

1. Start a Postgres container:

   docker run --name school-postgres -e POSTGRES_PASSWORD=your_db_password -e POSTGRES_DB=school_portal -p 5432:5432 -d postgres:14

2. Create a `.env` file in the project root (copy `.env.example`) and set values to match your DB:

   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_db_password
   PGDATABASE=school_portal

3. Initialize the database schema and seed data. You can run the SQL script `server/db/init.sql`:

    - Option A — (recommended) use the built-in Node initializer (no psql required):

       Copy `.env.example` to `.env` and edit credentials, then run:

       ```bash
       npm run db:init
       ```

       The script will connect to Postgres using your `.env` and run `server/db/init.sql` inside a transaction.

      After initialization you can seed bcrypt-hashed demo users (idempotent upsert):

      ```bash
      npm run db:seed
      ```

         Or run both init + seed in one command:

         ```bash
         npm run db:setup
         ```

      To fully reset the table and re-run the init SQL use:

      ```bash
      npm run db:reset
      ```

      You can run a small integration test (server must be running at http://localhost:5001):

      ```bash
      npm run test:integration
      ```

      DB status check
      ----------------

      If you have connectivity issues, run a quick status check which prints the Postgres server version and connection info:

      ```bash
      npm run db:status
      ```

      Common errors:
      - "role \"postgres\" does not exist": the user in your `.env` is `postgres` but the server has no such role — update `.env` (PGUSER) or create the role in Postgres.
      - Connection refused / could not connect: Postgres not running or wrong host/port.

      Authentication (JWT)
      --------------------

      The server issues a JWT on successful login and registration. The frontend stores it in `localStorage.authToken`.

      To call protected endpoints (writes: creating news, teachers, homework, grades, journal, reports, updating profile) include the header:

      ```
      Authorization: Bearer <token>
      ```

      Example using curl (login then use token):

      ```bash
      # login and get token
      token=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"balaiym@test.com","password":"123"}' http://localhost:5001/api/login | jq -r .token)
      # post a grade
      curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"student_email":"stu@example.com","subject":"Алгебра","grade":"5","term":"year"}' http://localhost:5001/api/grades
      ```

      Docker-compose (one-command Postgres)
      ------------------------------------

      If you don't have Postgres locally, start the provided container which maps host port 5433 -> container 5432:

      ```bash
      docker compose up -d
      # or: docker-compose up -d
      ```

      The compose file uses default credentials `postgres` / `postgres` and creates database `school_portal`. Update `.env` accordingly (copy `.env.example` which defaults to PGPORT=5433).

      If you prefer to import hashed passwords directly, use `server/db/init_hashed.sql` instead of `server/db/init.sql`.

    - Option B — using `psql` CLI:

       ```bash
       PGPASSWORD=1234 psql -h localhost -U postgres -d school_portal -f server/db/init.sql
       ```

    - Or use pgAdmin4's Query Tool to run `server/db/init.sql`.

4. Start the server (it will detect the Postgres env vars and use the DB):

   npm run dev

5. Open http://localhost:5001 and test login with seeded users (same emails/passwords as in `init.sql`).

## Connecting with pgAdmin4

1. Open pgAdmin4 and create a new Server Registration.
2. In the Connection tab set Host = `localhost`, Port = `5433`, Maintenance DB = `postgres` (or `school_portal`), Username = `postgres`, Password = the value you set.
3. Save and expand the server; open Query Tool and run `SELECT * FROM users;` to inspect the seeded users.

## Connecting with VS Code

There are several VS Code extensions for Postgres. One popular choice is "PostgreSQL" (search in Extensions view). Steps:

1. Install a Postgres extension (search "PostgreSQL").
2. Create a new connection using the same host/port/user/password/database as your `.env`.
3. Use the extension's UI to run queries or browse tables; you can run `server/db/init.sql` from the extension or use the Query runner.

If you prefer command-line, `psql` is available and works well for running `init.sql`.

## Notes & Security

- Passwords in `server/db/init.sql` are plain text for demo only. In production use bcrypt/scrypt/argon2 to hash passwords.
- The server currently compares plaintext passwords when using the DB; treat this repo as a demo and secure appropriately before public use.
- If you don't want Postgres and only need the UI to work locally, the fallback in-memory mode is fine for testing.

## Troubleshooting

- If the port 5000 is already used (macOS often binds services), the server uses port 5001 by default. You can override with `PORT` in `.env`.
- If the server logs show Postgres connection errors, verify your `.env` and that Postgres is listening on the expected host/port.

---
If you want, I can also add a small script to run `server/db/init.sql` via Node (so you can simply run `npm run db:init`). Tell me if you'd like that and I'll add it.


## Тестілеу (Testing)

Жобаны бағалау критерийлеріне сай келесі тестілеу жұмыстары жүргізілді:
1. **Manual Testing:** Chrome және Firefox браузерлерінде интерфейстің адаптивтілігі мен батырмалардың жұмысы тексерілді.
2. **API Testing:** Postman құралы арқылы `/api/login` және `/api/users` эндпоинттері тексеріліп, 200 OK жауаптары алынды.
3. **Validation Testing:** Логин формасындағы бос өрістер мен қате енгізілген деректерді өңдеу сценарийлері тексерілді.
# school_portal
 57d7d52d29a4d91c4911763ef075765a45c96a28
