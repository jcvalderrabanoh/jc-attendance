import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guardián de la BD compartida con jc-core: ninguna migración del Checador
 * puede tocar el esquema `public` ni tablas sin esquema, ni tirar los índices
 * GIN de campos personalizados (TypeORM los quitaría al regenerar).
 */
describe('Migraciones del esquema attendance', () => {
  const dir = __dirname;
  const files = readdirSync(dir).filter((f) => /^\d+-[A-Za-z]+\.ts$/.test(f));

  it('hay migraciones con nombre {timestamp}-{Nombre}.ts', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s solo toca el esquema attendance', (file) => {
    const source = readFileSync(join(dir, file), 'utf8');
    const statements = [...source.matchAll(/query\(`([\s\S]*?)`/g)].map((m) => m[1]);
    for (const sql of statements) {
      expect(sql).not.toMatch(/\bpublic\./i);
      // Toda tabla citada tras TABLE/ON/INTO/FROM/REFERENCES va calificada con "attendance".
      const refs = [...sql.matchAll(/\b(?:TABLE|ON|INTO|FROM|REFERENCES)\s+(?:IF (?:NOT )?EXISTS\s+)?"(\w+)"(\.)?/gi)];
      for (const ref of refs) {
        expect(`${ref[1]}${ref[2] ?? ''}`).toBe('attendance.');
      }
    }
  });

  it.each(files)('%s no borra los índices GIN de campos personalizados (salvo su down)', (file) => {
    const source = readFileSync(join(dir, file), 'utf8');
    const up = source.split('public async down')[0];
    expect(up).not.toMatch(/DROP INDEX[^`]*custom_fields/);
  });
});
