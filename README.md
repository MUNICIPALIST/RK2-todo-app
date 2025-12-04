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
- Production-ready `Dockerfile_Arkinov_Zhanbolat` with standalone Next output

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

3. Start PostgreSQL (either your own instance or via Docker Compose file `docker-compose_Arkinov_Zhanbolat.yml`):

   ```bash
   docker compose -f docker-compose_Arkinov_Zhanbolat.yml up -d db
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
docker compose -f docker-compose_Arkinov_Zhanbolat.yml up --build

# stop containers
docker compose -f docker-compose_Arkinov_Zhanbolat.yml down
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
   - This user needs push access to `municipalist/todo-app`.

4. **Create a Pipeline job**  
   - New Item → “Pipeline” → point to this repo.  
   - Set “Script Path” to `Jenkinsfile_Arkinov_Zhanbolat`.

5. **Pipeline stages (defined in `Jenkinsfile_Arkinov_Zhanbolat`)**
   - `Install`: `npm ci` (clean dependency install).  
   - `Test`: `npm test` (currently runs ESLint).  
   - `Build`: `npm run build` (Next.js production build).  
   - `Docker Build`: `docker build -t municipalist/todo-app:latest .`.  
   - `Push`: logs into Docker Hub via `docker-hub` credentials and pushes the image.

6. **Triggering builds**  
   - Click “Build Now” or configure Git webhooks so pushes run automatically.  
   - Each run archives the optimized Next.js build and publishes a Docker image ready
     for deployment together with `docker-compose_Arkinov_Zhanbolat.yml`.

## Kubernetes (k3s/k8s) Deployment

Manifests live under `k8s/`:

- `configmap_Arkinov_Zhanbolat.yaml` – non-secret app config (`APP_NAME`, `PORT`).
- `secret_Arkinov_Zhanbolat.yaml` – stores `DATABASE_URL` via `stringData` (replace with production DSN or use Sealed Secrets).
- `postgres_Arkinov_Zhanbolat.yaml` – lightweight PostgreSQL 16 StatefulSet + PVC + internal `todo-db` service used by the default DATABASE_URL.
- `deployment_Arkinov_Zhanbolat.yaml` – runs 2 replicas of `municipalist/todo-app:latest`, wires probes, envs, and resource requests.
- `service_Arkinov_Zhanbolat.yaml` – `NodePort` exposure on `30080` to reach the Next.js server running on container port `3000`.
- `hpa_Arkinov_Zhanbolat.yaml` – autoscaling policy: CPU 50% target, min 2 / max 5 pods (requires Metrics Server).

### Installing k3s locally on macOS

k3s is Linux-native, so run it inside a lightweight VM (Multipass) or use `k3d`. Below is a Multipass flow:

```bash
brew install multipass
multipass launch --name k3s --cpus 2 --mem 4G --disk 15G

# Install k3s inside the VM
multipass exec k3s -- bash -c "curl -sfL https://get.k3s.io | sh -"

# Extract kubeconfig to your host
multipass exec k3s -- sudo cat /etc/rancher/k3s/k3s.yaml > k3s.yaml
export KUBECONFIG=$PWD/k3s.yaml
```

(If you prefer `k3d`: `brew install k3d && k3d cluster create todo-cluster`.)

### Deploying

1. Build and push the Docker image (`docker push municipalist/todo-app:latest`).
2. If you want to use an external database, update `k8s/secret_Arkinov_Zhanbolat.yaml` with that `DATABASE_URL`. Otherwise leave it pointing to the in-cluster `todo-db` service created by `postgres_Arkinov_Zhanbolat.yaml`.
3. Apply the manifests:

   ```bash
   kubectl apply -f k8s/configmap_Arkinov_Zhanbolat.yaml
   kubectl apply -f k8s/secret_Arkinov_Zhanbolat.yaml
   kubectl apply -f k8s/postgres_Arkinov_Zhanbolat.yaml
   kubectl apply -f k8s/deployment_Arkinov_Zhanbolat.yaml
   kubectl apply -f k8s/service_Arkinov_Zhanbolat.yaml
   kubectl apply -f k8s/hpa_Arkinov_Zhanbolat.yaml
   ```

4. Verify:

   ```bash
   kubectl get pods
   kubectl get svc todo-service
   kubectl get hpa todo-app-hpa
   ```

5. Test from the host (NodePort):

   ```bash
   curl http://<node-ip>:30080/api/todos
   ```

For real environments, replace `NodePort` with `LoadBalancer`/Ingress, wire a managed PostgreSQL instance, and rotate secrets via your preferred secret manager.

## Provisioning with Ansible

The `ansible/` directory contains an idempotent playbook that prepares a fresh Ubuntu
host with Docker, kind-based Kubernetes, Jenkins, and then deploys the manifests in
`k8s/`.

1. Update `ansible/inventory.ini` with your server IP/SSH user.
2. Optional vars to override live at the top of `ansible/playbook_Arkinov_Zhanbolat.yml` (cluster name, versions, etc.).
3. Run the playbook from repo root:

   ```bash
   ansible-playbook -i ansible/inventory.ini ansible/playbook_Arkinov_Zhanbolat.yml
   ```

The playbook will:
- install Docker Engine and start the service
- download `kubectl` + `kind`
- install Jenkins via the official repo and ensure the service is up
- create a kind cluster (`todo-cluster` by default)
- sync the `k8s/` manifests to `/opt/pulse-tasks/k8s`
- apply the manifests with `kubectl apply -f /opt/pulse-tasks/k8s`

You can rerun the playbook at any time; tasks stay idempotent.
