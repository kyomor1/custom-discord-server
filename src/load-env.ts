// Minimal, zero-dependency .env loader.
//
// Imported as the very FIRST side-effect in index.ts so it populates process.env
// BEFORE any other module (notably middleware/auth.ts, which reads
// process.env.JWT_SECRET at module-load time and fail-fasts if it is missing).
//
// Real environment variables always win: we only fill in keys that are NOT already
// present in process.env. That means on Render the dashboard-provided vars take
// precedence and this loader is effectively a no-op (there is no .env file there).
//
// No values are ever logged.
import fs from 'fs';
import path from 'path';

try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of raw.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      // Skip empty keys and never override an already-set (real) environment variable.
      if (!key || key in process.env) continue;

      let value = line.slice(eq + 1).trim();
      // Strip a single pair of matching surrounding quotes, if present.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
} catch {
  // Never crash on env-file parsing problems — the app's own fail-fast checks
  // (e.g. the JWT_SECRET guard in middleware/auth.ts) report genuinely missing vars.
}
