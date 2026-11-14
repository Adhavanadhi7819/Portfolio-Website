import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function syncPortfolioSnapshotOnBuild(): Plugin {
  return {
    name: 'sync-portfolio-snapshot-on-build',
    buildStart() {
      try {
        const root = process.cwd();
        const rootDataFile = path.resolve(root, 'data.json');
        const stateFile = path.resolve(root, 'portfolio-data', 'state.json');
        const publicDir = path.resolve(root, 'public');
        const showcaseDir = path.join(publicDir, 'showcase');
        const staticAssetsDir = path.join(publicDir, 'uploaded-assets');
        const dataAssetsDir = path.resolve(root, 'portfolio-data', 'assets');

        let chosenRaw: string | null = null;

        const parseMeta = (filePath: string) => {
          if (!fs.existsSync(filePath)) return null;
          try {
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw) as {
              initialized?: boolean;
              version?: number;
              updatedAt?: string;
              activePortfolioId?: string;
              portfolios?: unknown[];
            };
            if (!Array.isArray(parsed.portfolios) || parsed.portfolios.length === 0) return null;
            return { raw, parsed };
          } catch {
            return null;
          }
        };

        const rootMeta = parseMeta(rootDataFile);
        const stateMeta = parseMeta(stateFile);

        if (stateMeta && rootMeta) {
          const stateTime = Date.parse(stateMeta.parsed.updatedAt || '') || 0;
          const rootTime = Date.parse(rootMeta.parsed.updatedAt || '') || 0;
          chosenRaw = stateTime > rootTime ? stateMeta.raw : rootMeta.raw;
        } else if (stateMeta) {
          chosenRaw = stateMeta.raw;
        } else if (rootMeta) {
          chosenRaw = rootMeta.raw;
        }

        if (!chosenRaw) return;

        const parsed = JSON.parse(chosenRaw) as {
          version?: number;
          updatedAt?: string;
          activePortfolioId?: string;
          portfolios?: unknown[];
        };
        if (!Array.isArray(parsed.portfolios) || parsed.portfolios.length === 0) return;

        const showcaseIndex = new Map<string, string>();
        if (fs.existsSync(showcaseDir)) {
          for (const entry of fs.readdirSync(showcaseDir)) {
            const full = path.join(showcaseDir, entry);
            if (!fs.statSync(full).isFile()) continue;
            const hashPrefix = crypto
              .createHash('sha256')
              .update(fs.readFileSync(full))
              .digest('hex')
              .slice(0, 32);
            showcaseIndex.set(hashPrefix, `/showcase/${entry}`);
          }
        }

        const referencedFiles = new Set<string>();
        const rewrite = (val: unknown): unknown => {
          if (typeof val === 'string') {
            const m = /^\/api\/assets\/([a-f0-9]{16,64}\.[a-z0-9]{1,8})$/i.exec(val.trim());
            if (m) {
              const fileId = m[1];
              const existing = showcaseIndex.get(fileId.split('.')[0]);
              if (existing) return existing;
              referencedFiles.add(fileId);
              return `/uploaded-assets/${fileId}`;
            }
            return val;
          }
          if (Array.isArray(val)) return val.map(rewrite);
          if (val !== null && typeof val === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
              out[k] = rewrite(v);
            }
            return out;
          }
          return val;
        };

        const staticPortfolios = rewrite(parsed.portfolios) as unknown[];
        if (referencedFiles.size > 0) {
          fs.mkdirSync(staticAssetsDir, { recursive: true });
          for (const fileId of referencedFiles) {
            const src = path.join(dataAssetsDir, fileId);
            const dest = path.join(staticAssetsDir, fileId);
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, dest);
            }
          }
        }

        const payload = {
          initialized: true,
          version: typeof parsed.version === 'number' ? parsed.version : 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          activePortfolioId: parsed.activePortfolioId || 'default_portfolio',
          portfolios: staticPortfolios
        };

        const jsonText = JSON.stringify(payload, null, 2) + '\n';
        fs.writeFileSync(path.join(publicDir, 'portfolio-snapshot.json'), jsonText);
        if (stateMeta && !rootMeta) {
          fs.writeFileSync(rootDataFile, jsonText);
        }
      } catch (err) {
        console.warn('Skipped buildStart portfolio snapshot sync:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [syncPortfolioSnapshotOnBuild(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
