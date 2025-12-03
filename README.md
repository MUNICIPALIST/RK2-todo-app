## Pulse Tasks

A full-stack Next.js todo board that ships a typed REST API, PostgreSQL
persistence, Tailwind-powered UI, and Dockerized runtime in one project.

### Stack

- Next.js 16 (App Router + React Compiler)
- Tailwind CSS v4 (utility-first styling)
- PostgreSQL 16 with `pg` client
- Typed REST API routes under `/api/todos`
- Docker + Compose for production-like local orchestration

## Features

- Modern glassmorphism UI with live task stats
- Create, toggle, and delete todos via REST endpoints
- Server-side validation powered by `zod`
- Automatic table provisioning on boot
- Production-ready Dockerfile with standalone Next output

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and adjust as needed:

   ```bash
   cp env.example .env.local
   # update DATABASE_URL if you're not using the defaults
   ```

3. Start PostgreSQL (either your own instance or via Docker):

   ```bash
   docker compose up -d db
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to use the board.

## REST API

| Method | Endpoint           | Description                |
| ------ | ------------------ | -------------------------- |
| GET    | `/api/todos`       | List all todos             |
| POST   | `/api/todos`       | Create `{ title: string }` |
| PATCH  | `/api/todos/:id`   | Update title/completed     |
| DELETE | `/api/todos/:id`   | Remove a todo              |

All responses follow `{ data: ... }` or `{ error: string }`.

## Dockerized Runtime

Everything — Next.js server and PostgreSQL — can run with one command:

```bash
# build and run both services
docker compose up --build

# stop containers
docker compose down
```

`env.docker` contains the environment defaults consumed by the `web`
service. Update the file if you need custom credentials or ports.

## CI/CD with Jenkins

1. **Install Jenkins (macOS)**  
   ```bash
   brew install jenkins-lts
   brew services start jenkins-lts
   ```
   Visit `http://localhost:8080`, unlock Jenkins with the initial admin password
   (`/usr/local/var/log/jenkins-lts/jenkins-lts.log`), then create an admin user.

2. **Prepare the build agent**  
   - Install Node.js 20 and npm (`brew install node@20`).  
   - Install Docker Desktop and ensure `docker` CLI works for the Jenkins user.  
   - Add `npm`, `node`, and `docker` to the Jenkins PATH (Manage Jenkins → Tools → Global Tool Configuration).

3. **Create credentials**  
   - Add Docker registry creds (Manage Jenkins → Credentials) with ID `docker-hub`.  
   - This user needs push access to `tg/todo-app`.

4. **Create a Pipeline job**  
   - New Item → “Pipeline” → point to this repo.  
   - Jenkins will automatically use the root `Jenkinsfile`.

5. **Pipeline stages (defined in `Jenkinsfile`)**
   - `Install`: `npm ci` (clean dependency install).  
   - `Test`: `npm test` (currently runs ESLint).  
   - `Build`: `npm run build` (Next.js production build).  
   - `Docker Build`: `docker build -t tg/todo-app:1.0 .`.  
   - `Push`: logs into Docker Hub via `docker-hub` credentials and pushes the image.

6. **Triggering builds**  
   - Click “Build Now” or configure Git webhooks so pushes run automatically.  
   - Each run archives the optimized Next.js build and publishes a Docker image ready
     for deployment together with the existing `docker-compose.yml`.
