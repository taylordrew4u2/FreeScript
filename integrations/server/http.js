import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createFreeScriptServer, VERSION } from './server.js';

export function createHTTPApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    const origin = req.headers.origin;
    if (origin && !['https://chatgpt.com', 'https://claude.ai', 'https://chat.openai.com'].includes(origin) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return res.status(403).send('Origin not allowed');
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
  app.use(express.json({ limit: '2mb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', name: 'FreeScript', version: VERSION, storage: 'stateless' }));
  app.get('/privacy', (_req, res) => res.type('text/plain').send('FreeScript AI Companion processes screenplay text sent through tool calls without saving it to a server-side library. No AI provider API key is required by FreeScript. Your chat provider processes the conversation under its own policies. Hosting providers may retain connection and operational metadata. FreeScript does not log screenplay text. The Claude local extension can read and save .fountain files only in the folder you select. The Mac app library is separate; use Fountain or JSON import/export to exchange scripts. No advertising or analytics are included. Source: https://github.com/taylordrew4u2/FreeScript'));
  app.get('/', (_req, res) => res.type('html').send(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>FreeScript — AI Companion</title><style>body{max-width:660px;margin:70px auto;padding:24px;background:#eee8dd;color:#342f29;font:15px/1.8 Courier,monospace}h1{letter-spacing:-2px}code{background:#e1d5c2;padding:6px;overflow-wrap:anywhere}a{color:inherit}li{margin:12px 0}</style><h1>FreeScript.</h1><p>A screenwriting companion for ChatGPT and Claude.</p><p>Create formatted screenplays, revise scenes, analyze dialogue, and export Fountain, FreeScript JSON, or print-ready HTML.</p><p><strong>MCP endpoint:</strong> <code>/mcp</code></p><ol><li>ChatGPT: Plugins → + → Add custom MCP server. Use this site’s HTTPS address followed by <code>/mcp</code>. Choose no authentication.</li><li>Claude: Customize → Connectors → Add → Custom → Web. Use the same MCP endpoint.</li></ol><p>Connection options depend on your account and workspace settings. This custom connector is not a directory listing.</p><p>FreeScript keeps no server-side screenplay library. Save exported files to keep a copy. The free hosting plan can sleep when idle; the first connection may take longer.</p><p><a href="/privacy">Privacy</a> · <a href="https://github.com/taylordrew4u2/FreeScript/tree/main/integrations">Source &amp; Claude Desktop installer</a></p></html>`));
  app.all('/mcp', async (req, res) => {
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).end();
    const server = createFreeScriptServer(); // Hosted requests never expose local workspace tools.
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { transport.close(); server.close(); });
    try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
    catch { if (!res.headersSent) res.status(500).json({ error: 'MCP request failed' }); }
  });
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((error, _req, res, _next) => res.status(error.status === 413 ? 413 : 400).json({ error: error.status === 413 ? 'Request too large' : 'Invalid request' }));
  return app;
}
if (process.env.FREESCRIPT_NO_LISTEN !== '1') {
  const listener = createHTTPApp().listen(Number(process.env.PORT || 8787), process.env.HOST || '0.0.0.0', () => console.error('FreeScript MCP service ready.'));
  process.on('SIGTERM', () => { listener.close(() => process.exit(0)); setTimeout(() => process.exit(0), 10_000).unref(); });
}
