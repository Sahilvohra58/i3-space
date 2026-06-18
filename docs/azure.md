# Azure Setup

All resources live in the **Canada Central** region under subscription associated with `i3institute.ca`.

---

## Resource group

| Field | Value |
|---|---|
| Name | `rg-shared-prod` |
| Region | Canada Central |

Sahil (`sahil.vohra@i3institute.ca`) has the **Contributor** role on this resource group — enough to deploy, update, and read, but not to assign roles to service principals (that requires Owner).

---

## Azure AD — App Registration

| Field | Value |
|---|---|
| Display name | `i3space-app` |
| Application (client) ID | `0b7fb923-f379-4245-b319-a9c1725af4f5` |
| Directory (tenant) ID | `d1aec0dc-1c2b-4541-9724-3a6f21519d9e` |
| Supported account types | Single tenant (i3institute.ca only) |
| Redirect URIs (SPA) | `http://localhost:5173`, `https://i3-space.pages.dev` |
| API permissions | `openid`, `profile`, `email` (Microsoft Graph, delegated) |

The frontend uses this registration to acquire ID tokens via MSAL. The backend validates those tokens using the tenant's JWKS endpoint.

---

## Azure AD — Enterprise Application

| Field | Value |
|---|---|
| Display name | `i3space-app` |
| Service principal (object) ID | `caf970ac-5dd7-42be-a400-06e6c577bf51` |
| Application ID | `0b7fb923-f379-4245-b319-a9c1725af4f5` (same as App Registration) |
| Assignment required | **Yes** — only users explicitly added to "Users and groups" can sign in |

The Enterprise Application is the tenant-level representation of the app. "Assignment required = Yes" means Microsoft enforces per-user access control before the app even sees the request.

### Admin consent

Tenant-wide admin consent must be granted once by a Global Admin (Mujtaba) before any user can sign in. Consent URL:

```
https://login.microsoftonline.com/d1aec0dc-1c2b-4541-9724-3a6f21519d9e/adminconsent?client_id=0b7fb923-f379-4245-b319-a9c1725af4f5&redirect_uri=https://i3-space.pages.dev
```

### Assigned users

Managed via Azure Portal → Enterprise Applications → i3space-app → Users and groups. Sahil can add/remove users without Mujtaba's involvement. See [adding-users.md](adding-users.md).

---

## Azure Container Registry (ACR)

| Field | Value |
|---|---|
| Registry name | `i3spacecr` |
| Login server | `i3spacecr.azurecr.io` |
| SKU | Basic |
| Resource group | `rg-shared-prod` |
| Repository | `i3space-backend` |

GitHub Actions pushes new backend images here on every `main` push that touches `backend/**`. Admin credentials (username + password) are stored as GitHub Actions secrets (`ACR_USERNAME`, `ACR_PASSWORD`) — found in Azure Portal → i3spacecr → Access keys.

---

## Azure Container Apps

| Field | Value |
|---|---|
| App name | `i3space-backend` |
| Container Apps Environment | `i3space-env` (or the auto-created environment in `rg-shared-prod`) |
| Resource group | `rg-shared-prod` |
| Region | Canada Central |
| Image | `i3spacecr.azurecr.io/i3space-backend:latest` |
| Ingress | External, port 8080, HTTPS |
| Min replicas | 0 (scales to zero; has cold-start latency on first request after idle) |
| VNet integration | `VNET1`, subnet `container-apps` |
| Public URL | `https://i3space-backend.whitepond-61860c90.canadacentral.azurecontainerapps.io` |

The Container App pulls from ACR using its managed identity (or the ACR admin credentials configured during setup). Environment variables and secrets are managed in the portal under the app's "Environment variables" and "Secrets" panels.

### Deploying a new revision

After CI pushes a new image to ACR:

```bash
az containerapp update \
  --name i3space-backend \
  --resource-group rg-shared-prod \
  --image i3spacecr.azurecr.io/i3space-backend:latest
```

This creates a new revision and routes traffic to it immediately.

---

## Azure PostgreSQL Flexible Server

| Field | Value |
|---|---|
| Server name | `i3-postgressqldb` |
| FQDN | `i3-postgressqldb.postgres.database.azure.com` |
| Database | `i3space` |
| Resource group | `rg-shared-prod` |
| Region | Canada Central |
| VNet | `VNET1`, subnet `default` |
| Public network access | **Disabled** — reachable only from within `VNET1` |

> **Security constraint:** PostgreSQL must remain VNet-private. Do not enable public access. The Container App reaches it via private VNet connectivity (both are in `VNET1`).

The `DATABASE_URL` connection string is stored as a secret in the Container App. The ORM (SQLAlchemy) creates all tables on startup via `Base.metadata.create_all(engine)`.

---

## Virtual Network (VNet)

| Field | Value |
|---|---|
| VNet name | `VNET1` |
| Resource group | `rg-shared-prod` |
| Region | Canada Central |

| Subnet | Used by |
|---|---|
| `default` | PostgreSQL Flexible Server (private DNS zone delegation) |
| `container-apps` | Azure Container Apps environment (VNet integration) |

The two subnets allow the Container App to reach PostgreSQL over a private IP — no traffic leaves the Azure network.

---

## Deleted / cleaned-up resources

These were created during earlier setup attempts and have since been removed:

| Resource | Reason deleted |
|---|---|
| `i3space-envi3spacecrrg-shared-prodOidc` (user-assigned managed identity) | Created during a failed OIDC-based GitHub Actions deployment attempt; not needed |
| GitHub → Azure App Registration (for OIDC CI/CD) | Deleted in favour of ACR admin credential-based push |
