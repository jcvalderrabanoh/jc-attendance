/** Cola durable de reportes: 3 reintentos con backoff exponencial (igual que jc-core). */
export const REPORTS_QUEUE = 'attendance-reports';

export const REPORTS_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

/** `REPORTS_INLINE=true`: genera en el mismo proceso (pruebas o despliegue sin Redis). */
export const reportsInline = (): boolean => process.env.REPORTS_INLINE === 'true';
