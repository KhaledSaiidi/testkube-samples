# Assignment: 
## Case
A team has developed a new application and all their work is available at /home/khaleds/testkube-samples.
The team needs to deploy the application to Kubernetes, a tool that they are not familiar with. 
You are tasked with creating the required deployment tooling and crafting a great developers’experience.

## Deliverable
Please prepare a presentation or document outlining your design for the developer platform including a critical analysis of the most critical requirements. 
We encourage you to develop an MVP of your proposed platform.

# Issues To Check: 
| #  | Finding                                               | Clarification                                                                                                                                                                                                                             | Priority     |
| -- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1  | Frontend API address is hardcoded                     | `const API_ORIGIN = "http://localhost:8080"` is compiled into the frontend. In Kubernetes, the browser cannot use cluster-local service discovery. Prefer same-origin `/api` routing through Gateway API.                                 | **Critical** |
| 2  | PostgreSQL configuration is incomplete                | API builds `postgres://api-user:api-password@${DB_HOST}:${DB_PORT}/api-db`. Only `DB_HOST` and `DB_PORT` are configurable; user, password and DB name are hardcoded. Use `DATABASE_URL` or dedicated DB env vars backed by Secrets.       | **Critical** |
| 3  | Database failures return HTTP 200                     | In `/hello-pg`, the `catch` block returns JSON without setting an error status, so PostgreSQL failure still returns HTTP `200`. Frontend also needs to check `response.ok`.                                                               | **High**     |
| 4  | No dedicated health/readiness endpoints               | API exposes only `/hello` and `/hello-pg`. Add `/healthz` for process health and `/readyz` for readiness; readiness can include a lightweight PostgreSQL check.                                                                           | **Critical** |
| 5  | Graceful shutdown is incorrectly wired                | Code calls `GracefulShutdown(app)` before `http.createServer(app).listen(...)`. The shutdown handler should receive the actual HTTP server and also close the PostgreSQL pool.                                                            | **High**     |
| 6  | Vite preview is used as production server             | Web Dockerfile ends with `CMD ["npx", "vite", "preview"]`. Vite preview is not intended as the production static server; use a minimal production runtime for the built `dist/`.                                                          | **High**     |
| 7  | PostgreSQL connection created per request             | `/hello-pg` creates a new `pg.Client()`, calls `connect()`, executes one query, then `end()` for every request. Use a shared `pg.Pool`; current error paths can also skip `client.end()`.                                                 | **High**     |
| 8  | API port is hardcoded                                 | API defines port `8080` directly in code. Kubernetes can still target it, but `process.env.PORT ?? 8080` makes the service more portable.                                                                                                 | **Medium**   |
| 9  | Tests do not validate the full three-tier application | API tests validate `/hello`; Cypress validates mainly frontend UI behavior. Nothing currently validates the complete browser → API → PostgreSQL path. Add one deployed smoke/E2E test.                                                    | **High**     |
| 10 | Test endpoints default to localhost                   | Hurl targets `http://localhost:8080` and Cypress defaults to `http://localhost:4173`. Keep localhost defaults, but allow `API_BASE_URL` / `WEB_BASE_URL` overrides for CI and Kubernetes environments.                                    | **Medium**   |
| 11 | Importing the API starts the HTTP server              | Tests import `app` from `index.mjs`, but importing that module also starts `http.createServer(app).listen(...)`. Separate Express app creation from server startup and lifecycle handling.                                                | **High**     |
| 12 | Container base images use floating tags               | Dockerfiles use `FROM node:lts`; Compose uses `image: postgres`. These floating tags can change between builds. Pin versions, ideally digests for stronger reproducibility.                                                               | **High**     |
| 13 | Containers run as root                                | Neither Node Dockerfile defines `USER`. Containers therefore run as root by default and may conflict with `runAsNonRoot`, `allowPrivilegeEscalation: false`, and other secure Kubernetes defaults.                                        | **High**     |
| 14 | Dockerfiles copy/install too much of the monorepo     | Both Dockerfiles use `COPY . .`, and root-level `npm ci` installs dependencies for the entire workspace. Each image therefore receives unrelated application code, tests and tooling.                                                     | **High**     |
| 15 | Container images are unnecessarily large              | Full Node base images, workspace-wide dependencies, dev tooling, source code and build tooling remain in runtime images. Web is also not truly multi-stage. Use scoped installs, production-only dependencies and minimal runtime stages. | **High**     |

# Work Done: 

## Phase 1:
This is done in the Developer repository (/home/khaleds/testkube-samples)
- First, create a GitHub Actions CI pipeline for the application repositories. The pipeline will run the application tests and validation, build the Docker images, tag them with a semantic version, and push them to GitHub Container Registry.
- Then, create a reusable and opinionated Helm chart that acts as the platform’s deployment abstraction. Instead of exposing every Kubernetes option to developers, the chart will provide sensible defaults and generate the required Kubernetes resources such as Deployments, Services, ServiceAccounts, HTTPRoutes, NetworkPolicies, probes, security contexts, and resource configurations from a small developer-facing values file.

## Phase 2:
This is done in the Platform repository (/home/khaleds/personal-projects/apex-sync)
apex-sync is a Kubernetes platform bootstrap and GitOps repo. Its core job is to take an existing Kubernetes cluster, install the minimum bootstrap layer, then hand long-term ownership to Argo CD.

The project gives you a full platform stack:

CNI/networking: Cilium, kube-proxy replacement, Hubble options
GitOps: Argo CD with custom CMP plugins
Ingress/service mesh: Istio, Gateway API, public gateway, Kiali
DNS/TLS: external-dns, cert-manager, Route53 ACME issuer
Load balancing: MetalLB
Storage: OpenEBS LocalPV
Policy: Kyverno
Secrets reflection: Reflector
Object storage: Garage S3
Stateful workloads: Percona MySQL/PXC operator, Percona PostgreSQL operator, database resources, backup jobs
Identity: Keycloak plus realm/client config
Observability: Mimir, Loki, Tempo, Grafana, Alloy, kube-state-metrics, Grafana dashboards, ServiceMonitors

Main docs: [README.md (line 1)](/home/khaleds/personal-projects/apex-sync/README.md:1)

How The Flow Works

The flow is intentionally split into bootstrap and steady-state GitOps.

scripts/bootstrap.sh loads .env.bootstrap and every scalar value from override-config/*.yaml as TF_VAR_*.
Terraform runs from [terraform/stack/main/main.tf (line 1)](/home/khaleds/personal-projects/apex-sync/terraform/stack/main/main.tf:1).
Terraform renders local artifacts:
Argo CD Helm values
root Argo CD Application
Ansible inventory
Ansible vars
Terraform then runs Ansible through null_resource provisioners.
Ansible installs local tooling, Cilium, and Argo CD.
Ansible creates bootstrap secrets:
GitHub App repo credentials for Argo CD
Route53 credentials for cert-manager/external-dns reflection
Ansible applies the root Argo CD app.
Argo CD syncs gitops/argo-apps, which fans out into the platform apps.
Most child apps render with the envsubst CMP plugin, then kustomize build --enable-helm.

Bootstrap entrypoint: [scripts/bootstrap.sh (line 1)](/home/khaleds/personal-projects/apex-sync/scripts/bootstrap.sh:1)
Ansible playbook: [ansible/playbooks/bootstrap.yml (line 1)](/home/khaleds/personal-projects/apex-sync/ansible/playbooks/bootstrap.yml:1)

GitOps Structure

The root app points to gitops/argo-apps.

Important sync waves:

-90: Cilium
-20: cert-manager, reflector
-10: MetalLB, OpenEBS
0: Istio main
1: Argo CD self-management
5: Kyverno
8: external-dns
10: Garage, stateful operators
20: stateful database resources
21-22: Keycloak and Keycloak config
23: observability app-of-apps
26: observability backends
29: observability config

The app-of-apps pattern is used more than once:

root app deploys platform apps
istio-main deploys Istio base, public gateway, Kiali
observability deploys foundation, backends, and config layers

Architecture Decisions

The biggest architectural decision is ownership separation:

Terraform does not provision the Kubernetes cluster right now.
Terraform renders bootstrap artifacts and orchestrates Ansible.
Ansible handles one-time imperative setup and sensitive bootstrap secrets.
Argo CD owns the long-running desired state from Git.

That is a practical hybrid model: use imperative tools only until GitOps can take over.

Other notable decisions:

Externalized configuration: override-config/*.yaml is the main non-secret config surface. Chart versions, replica counts, resources, domains, and observability tuning live there.
Secrets stay local during bootstrap: .env.bootstrap supplies GitHub App and AWS Route53 credentials and is ignored by Git.
CMP-based rendering: Argo CD repo-server gets custom sidecars from cmp-build/. One plugin renders app-of-apps, another does env substitution before Kustomize/Helm rendering.
Kustomize + Helm: apps are mostly Kustomize overlays that pull Helm charts declaratively through helmCharts.
Sync waves encode dependencies: networking and CRDs come early; workloads depending on them come later.
Observability is layered: CRDs/operators first, then actual backends, then scrape/dashboard config.
Centralized ServiceMonitor ownership: most monitors live in obs-config instead of being scattered through Helm chart values.
Argo CD self-manages after bootstrap: Argo CD is initially installed by Ansible, then reconciled by its own GitOps app.
Local runtime artifacts are disposable: Terraform state, rendered files, Ansible collections, and logs are generated and excluded from desired state.

Patterns Used

App-of-apps with Argo CD
Sync-wave dependency ordering
Bootstrap-to-GitOps handoff
Helm charts wrapped by Kustomize
Environment-specific rendering through Argo CD CMP
Config-as-data via override-config
Operators for complex domains: Grafana, OpenTelemetry, Percona, Keycloak
Bootstrap jobs for cluster-internal setup that cannot be expressed as simple Helm values
Secret reflection through Reflector annotations
Declarative observability config using ServiceMonitor, PodMonitor, GrafanaDatasource, GrafanaFolder, and GrafanaDashboard resources

What This Project Gives You

In practical terms, this repo gives you a reusable Kubernetes platform baseline. Once pointed at a cluster and configured with GitHub App plus Route53 credentials, it can bootstrap networking, GitOps, ingress, TLS, DNS, policy, storage, databases, object storage, identity, and observability.

It is not primarily an application repo. It is a platform operations repo. The app workload surface appears to be downstream of the platform, with testkube-sample and database credential reflection acting as an example/integration target.