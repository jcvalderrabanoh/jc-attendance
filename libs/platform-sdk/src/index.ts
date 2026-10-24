/**
 * @jc/platform-sdk — lo que todo producto de la plataforma repite (ADR-001,
 * ADR-003 paso 2): sesión de jc-core, permisos de producto y contratación,
 * multi-tenant con soft delete, e interfaces de capas.
 */
export * from './auth';
export * from './layers';
export * from './tenancy';
