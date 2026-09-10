import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function googleSheetProxyPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/proxy-google-sheet')) {
      return next();
    }
    try {
      const parsedUrl = new URL(req.url, 'http://localhost:3000');
      const sheetId = parsedUrl.searchParams.get('sheetId')?.trim() || '';
      const sheetName = parsedUrl.searchParams.get('sheet')?.trim() || 'Murid';

      if (!sheetId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'sheetId parameter is required' }));
        return;
      }

      const cleanSheet = encodeURIComponent(sheetName);
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${cleanSheet}&headers=1&tq=`;

      let upstreamRes = await fetch(gvizUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'text/csv,text/plain,*/*'
        }
      });

      if (!upstreamRes.ok) {
        const isGid = /^\d+$/.test(sheetName);
        const exportUrl = isGid
          ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetName}`
          : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${cleanSheet}`;
        upstreamRes = await fetch(exportUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Accept': 'text/csv,text/plain,*/*'
          }
        });
      }

      if (!upstreamRes.ok) {
        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Google Sheets returned status ${upstreamRes.status}` }));
        return;
      }

      const csvData = await upstreamRes.text();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(csvData);
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Internal proxy error' }));
    }
  };

  return {
    name: 'google-sheet-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), googleSheetProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
