# jc-attendance — instrucciones para agentes

- Plan y decisiones en `docs/` (empieza por `00-resumen.md`). Si cambias una decisión, actualiza el doc, y luego Notion (Wiki de Producto › Checador — SaaS Wiki) y Obsidian (`node scripts/sync-obsidian.mjs`).
- Misma arquitectura por capas que jc-core (controllers → services → blueprints → checkers/rules → processes → daos; queue/listeners; `index.ts` por carpeta; sin `manager.transaction`).
- **BD compartida con jc-core:** todo vive en el esquema `attendance`. Nunca escribas en `public.*`, nunca crees FK hacia `public.*`, nunca uses `synchronize`. Las migraciones van en `apps/api/src/migrations` con `{timestamp}-{Nombre}.ts` y tabla `attendance.attendance_migrations`.
- Los marcajes (`punches`) son append-only: corregir es crear un registro nuevo.
- El motor de cálculo (`libs/rules-engine`) es TypeScript puro y se cubre con tablas de casos (medianoche, horario de verano, 48→46 h, menores, festivos).
- Al añadir o cambiar una pantalla: actualiza `docs/07-pantallas-y-stitch.md` (ruta, prompt de Stitch, enlace a la propuesta).
