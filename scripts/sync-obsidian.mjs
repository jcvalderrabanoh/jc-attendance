// Genera el espejo de Obsidian (obsidian/Checador) a partir de docs/.
// Uso: node scripts/sync-obsidian.mjs [carpetaDestino]
import { mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { basename, join, relative, resolve } from 'path';

const root = resolve(new URL('..', import.meta.url).pathname);
const src = join(root, 'docs');
const dest = resolve(process.argv[2] ?? join(root, 'obsidian', 'Checador'));
const today = new Date().toISOString().slice(0, 10);

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

for (const file of walk(src).filter((f) => f.endsWith('.md'))) {
  const rel = relative(src, file);
  // Dentro de una tabla el `|` del alias se escapa (`\|`) o Obsidian parte la celda.
  const body = readFileSync(file, 'utf8')
    .split('\n')
    .map((line) =>
      line.replace(/\[([^\]]+)\]\((?!https?:)([^)#]+)\.md(#[^)]*)?\)/g, (_, text, target) =>
        `[[${basename(target)}${line.trimStart().startsWith('|') ? '\\|' : '|'}${text}]]`,
      ),
    )
    .join('\n');
  const front = `---\nproyecto: Checador\nfuente: jc-attendance/docs/${rel}\nsincronizado: ${today}\ntags: [checador, asistencia]\n---\n\n`;
  const out = join(dest, rel);
  mkdirSync(join(out, '..'), { recursive: true });
  writeFileSync(out, front + body);
}
writeFileSync(
  join(dest, 'Checador.md'),
  `---\nproyecto: Checador\n---\n\n# Checador — índice\n\nEspejo de \`jc-attendance/docs\` (sincronización manual, no bidireccional). Empieza en [[00-resumen]].\n`,
);
console.log(`Espejo de Obsidian generado en ${dest}`);
