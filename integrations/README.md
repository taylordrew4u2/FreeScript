# FreeScript AI Companion

Screenwriting tools for ChatGPT, Claude web, and Claude Desktop. Includes screenplay formatting, scene revision, dialogue/character analysis, and Fountain, FreeScript JSON, and print-ready HTML export. MCP Apps-compatible hosts can show an interactive typewriter preview.

**Live connector:** [freescript-ai-companion.onrender.com](https://freescript-ai-companion.onrender.com)

**MCP server URL:** `https://freescript-ai-companion.onrender.com/mcp`

**Downloads:** [Claude Desktop installer](https://github.com/taylordrew4u2/FreeScript/releases/download/plugins-v0.1.0/FreeScript-Claude-0.1.0.mcpb) · [Portable ChatGPT plugin package](https://github.com/taylordrew4u2/FreeScript/releases/download/plugins-v0.1.0/FreeScript-ChatGPT-Plugin-0.1.0.zip)

## ChatGPT

Open the hosted FreeScript connector's home page for its MCP URL and current setup instructions. In ChatGPT web, open **Plugins → + → Add custom MCP server**, enter the HTTPS URL ending in `/mcp`, and choose **No authentication**. Review the connection details, create the plugin, and install it before mentioning FreeScript in a chat. Account and workspace permissions apply.

The portable plugin ZIP includes the remote `mcp.json`, branding, and a screenwriting skill. It is a developer/distribution package; it is not a claim of approval in the public plugin directory. Connecting the hosted MCP endpoint is the direct personal-install path. Directory publication requires the platform's submission and review process.

## Claude Desktop — local extension

Download `FreeScript-Claude-0.1.0.mcpb` from the GitHub plugin release. In Claude Desktop, open **Settings → Desktop app → Manage** next to Extensions (or **Settings → Extensions** in older layouts), then **Advanced settings → Install Extension…**. Select the `.mcpb` and choose a screenplay folder.

The extension bundles its server and dependencies. Claude Desktop supplies Node.js; no separate Node installation is needed when its bundled runtime is Node 22 or later. The extension adds local list/read/save tools for `.fountain` files in your chosen folder. A revision from the latest read is required before overwriting a file. There is no delete tool.

## Claude web — hosted connector

Open **Customize → Connectors → Add → Custom → Web** and use the same HTTPS `/mcp` URL. Choose no authentication. Available connection options and limits depend on your account and organization.

## Try it

- “Use FreeScript to draft a two-page scene about two strangers waiting for the last train.”
- “Use FreeScript to analyze which characters speak the most in this screenplay.”
- “Revise scene two, preserving the other scenes, then export FreeScript JSON.”
- Claude Desktop: “Save this screenplay as `Last Train.fountain` in my FreeScript folder.”

The assistant supplies the creative text. FreeScript formats, validates, analyzes, and exports it; it does not call a separate AI API or require an AI API key.

## Use with the Mac app

The plugin's folder and the Mac app's internal autosave library are separate. In FreeScript for Mac, use **Export → Import a screenplay** to open a plugin-generated `.fountain` or FreeScript `.json` file. Export Fountain from the Mac app into the extension's chosen folder to work on it in Claude. There is no live synchronization in this version.

## Privacy and limits

The hosted server is stateless and does not save a screenplay library, share drafts between users, or expose local filesystem tools. It does not log screenplay text. Your chat provider handles your conversation under its own policies, and the hosting provider may retain operational metadata. Copy or export drafts to retain them. The local Claude extension only accesses the selected folder and has no separate network calls.

Each screenplay input is limited to 150,000 characters. Page counts are estimates. Fountain support covers common elements, not the full specification. HTML exports must be opened in a browser and printed to create PDF files. In-chat preview and clipboard support vary by host; plain-text exports are always available through the tools.

The free Render compute plan can sleep while idle. The first connection may take longer; retry after the service wakes. Free service quotas and provider limits apply. No paid compute or database is provisioned by this project.

## Build and test

From the repository root:

```sh
npm --prefix integrations ci --include=dev
npm --prefix integrations run build
npm --prefix integrations test
npm --prefix integrations run test:widget  # requires the root project's Electron/Playwright development dependencies
npm --prefix integrations start
```

The HTTP endpoint is `/mcp` and the health endpoint is `/health`. It binds to `PORT` (default `8787`) on `0.0.0.0`. The local stdio server is `integrations/dist/stdio.cjs`; set `FREESCRIPT_WORKSPACE` to the allowed folder.

The packaged local extension currently targets macOS. The hosted connector is independent of your device's operating system.

To build the installable artifacts on Mac or Linux with `zip` installed:

```sh
cd integrations
FREESCRIPT_MCP_URL=https://YOUR-HOST/mcp npm run pack
```

## Deploy from Git

Create a Node web service from `https://github.com/taylordrew4u2/FreeScript.git`, branch `main`, using the free compute plan:

- Build: `npm --prefix integrations ci --include=dev && npm --prefix integrations run build`
- Start: `node integrations/dist/http.cjs`
- Node version: `22`
- Health path: `/health` when configuring HTTP checks; default TCP checks also work.

No database, private key, AI API key, or authentication secret is needed for this stateless service. Do not expose a local workspace server over the public internet.

## Official installation references

- [ChatGPT custom MCP plugins](https://developers.openai.com/api/docs/guides/custom-mcp-server)
- [OpenAI portable plugin packaging](https://developers.openai.com/plugins/build/plugins)
- [Claude Desktop extensions](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [Claude connectors](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)

The project is MIT licensed. Bundled third-party components retain their own licenses.
