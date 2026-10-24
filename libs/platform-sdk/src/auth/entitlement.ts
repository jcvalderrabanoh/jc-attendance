/**
 * Contratación de productos por cuenta: fila activa (y con prueba vigente) en
 * `public.account_apps` de jc-core. Cada producto la consulta con su DAO de
 * solo lectura y la inyecta en su guard con este token.
 */
export const PRODUCT_ENTITLEMENT = 'PRODUCT_ENTITLEMENT';

export interface ProductEntitlement {
  hasApp(accountId: string, app: string): Promise<boolean>;
}

/** Misma regla que el AppAccessGuard de jc-core (`$1` = accountId, `$2` = app). */
export const ACCOUNT_HAS_APP_SQL = `SELECT 1 FROM public.account_apps
  WHERE "accountId" = $1 AND "app" = $2 AND "status" = 'active'
    AND ("trialEndsAt" IS NULL OR "trialEndsAt" > now())
  LIMIT 1`;
