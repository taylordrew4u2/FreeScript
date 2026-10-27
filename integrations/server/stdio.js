import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createFreeScriptServer } from './server.js';
import { Workspace } from './workspace.js';

const workspace = new Workspace(process.env.FREESCRIPT_WORKSPACE || join(homedir(), 'Documents', 'FreeScript'));
createFreeScriptServer({ workspace }).connect(new StdioServerTransport()).catch(() => { console.error('Could not start FreeScript.'); process.exitCode = 1; });
