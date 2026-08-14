# Testkube samples Helm chart

Opinionated chart for deploying the API and web workloads. PostgreSQL, Gateway infrastructure, namespace management and Istio injection are platform responsibilities.

## Prerequisites

- Gateway API CRDs and the Istio Gateway controller.
- The `public-gateway` Gateway in namespace `istio-ingress`.
- Release namespace labels:
  - `istio-injection: enabled`
  - `ingress.apex-sync.io/public-gateway-access: "true"`
- Reflected Secret `api-db-credentials` with the Percona-generated `uri` key.
- Access to the configured GHCR images.

## Install

```bash
helm upgrade --install testkube-samples ./helm/testkube-samples \
  --namespace testkube-sample \
  --set api.image.repository=ghcr.io/OWNER/testkube-samples-api \
  --set api.image.tag=0.1.0 \
  --set web.image.repository=ghcr.io/OWNER/testkube-samples-web \
  --set web.image.tag=0.1.0 \
  --set httpRoute.hostname=testkube.example.com
```

For GitOps, store these overrides in Argo CD values rather than using command-line flags.

## Routing

- HTTP requests are redirected to HTTPS.
- `/api` is routed directly to the API Service.
- All other paths are routed to the web Service.
- Health and readiness endpoints remain internal to Kubernetes probes.

## Availability

PDBs are disabled by default for the single-replica development configuration. Enable each PDB together with at least two replicas for a production deployment.

## Validation

```bash
helm lint helm/testkube-samples
helm template testkube-samples helm/testkube-samples --namespace testkube-sample
```
