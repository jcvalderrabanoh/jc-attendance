/**
 * pm2 — mismo esquema que jc-core: lee el .env del servidor en cada
 * inicio/reload y corre en cluster con UNA instancia para recargar sin corte
 * (wait_ready + process.send('ready') en main.ts).
 */
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  try {
    const env = {};
    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

const envVars = parseEnvFile(path.join(__dirname, 'apps/api/.env'));

module.exports = {
  apps: [
    {
      name: 'jc-attendance-api',
      cwd: path.join(__dirname, 'apps/api'),
      script: 'dist/main.js',
      node_args: '--max-old-space-size=768',
      exec_mode: 'cluster',
      instances: 1,
      wait_ready: true,
      listen_timeout: 60_000,
      kill_timeout: 30_000,
      env: { NODE_ENV: 'production', PORT: '3100', ...envVars },
    },
  ],
};
