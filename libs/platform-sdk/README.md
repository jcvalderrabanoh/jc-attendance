# @jc/platform-sdk

Paso 2 de ADR-003 (jc-core `docs/arquitectura/`): lo que cada producto de la
plataforma (Checador, anestesia, lumen-view…) repetía por su cuenta.

| Módulo | Qué trae |
|---|---|
| `auth` | `verifyPlatformToken` (JWT de jc-core, claim `app`), `resolveProductRole` (permisos `producto.*` → rol), `ProductEntitlement` + `ACCOUNT_HAS_APP_SQL` (`public.account_apps`). |
| `tenancy` | `BaseTenantEntity` (uuid, `accountId` sin FK, `status`, fechas), `TenantDao` (todo acotado a la cuenta, soft delete), paginación, `StatusForEntityEnum`. |
| `layers` | `ProcessInterfaceResult`, `CheckRulesAndProcessInterfaceResult`, `BasicBluePrintInterface`, `ok`/`fail`/`unwrap`/`found`. |

Sin dependencias propias: `@nestjs/common`, `typeorm` y `jsonwebtoken` son peer
dependencies del producto.

## Distribución

Hoy vive en el monorepo de jc-attendance (primer consumidor). Cuando lo adopte
un segundo backend (jc-core o SIRA) pasa a su propio repo y se publica en
GitHub Packages; la API pública es la de `src/index.ts`.
