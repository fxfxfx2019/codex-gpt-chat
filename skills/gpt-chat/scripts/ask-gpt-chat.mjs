#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_SERVICE_ROOT = process.env.GPT_CHAT_HOME ||
  process.env.GPT_CHAT_SERVICE_ROOT ||
  '';
const DEFAULT_TOKEN = 'change-me';
const DEFAULT_SESSION = 'gpt-chat-skill';
const DEFAULT_INSTANCE = 'gpt-chat';
const BRIEF_PREFIX = '\u8bf7\u7b80\u6d01\u56de\u7b54\uff0c\u76f4\u63a5\u7ed9\u7ed3\u8bba\u548c\u5173\u952e\u7406\u7531\uff0c\u4e0d\u8981\u5bd2\u6684\u3002';
const OUTPUT_PREFIX = 'gpt\u56de\u590d\uff1a\u201c';
const OUTPUT_SUFFIX = '\u201d';

function parseArgs(argv) {
  const args = {
    apiUrl: process.env.GPT_CHAT_API_URL || '',
    serviceRoot: DEFAULT_SERVICE_ROOT,
    token: process.env.GPT_CHAT_API_TOKEN || DEFAULT_TOKEN,
    sessionId: process.env.GPT_CHAT_SESSION || DEFAULT_SESSION,
    instance: process.env.GPT_CHAT_INSTANCE || DEFAULT_INSTANCE,
    browserPort: Number(process.env.GPT_CHAT_BROWSER_PORT || process.env.CHATGPT_BROWSER_PORT || 9223),
    browserProfileDir: process.env.GPT_CHAT_BROWSER_PROFILE_DIR || '.chatgpt-browser-profile',
    browserWidth: Number(process.env.GPT_CHAT_BROWSER_WIDTH || 460),
    browserHeight: Number(process.env.GPT_CHAT_BROWSER_HEIGHT || 640),
    browserX: Number(process.env.GPT_CHAT_BROWSER_X || 20),
    browserY: Number(process.env.GPT_CHAT_BROWSER_Y || 20),
    question: '',
    noStart: false,
    fresh: false,
    temporary: false,
    brief: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--api-url') args.apiUrl = argv[++i] || args.apiUrl;
    else if (arg === '--home') args.serviceRoot = argv[++i] || args.serviceRoot;
    else if (arg === '--token') args.token = argv[++i] || args.token;
    else if (arg === '--session') args.sessionId = argv[++i] || args.sessionId;
    else if (arg === '--instance') args.instance = argv[++i] || args.instance;
    else if (arg === '--browser-port') args.browserPort = Number(argv[++i] || args.browserPort);
    else if (arg === '--browser-profile-dir') args.browserProfileDir = argv[++i] || args.browserProfileDir;
    else if (arg === '--browser-width') args.browserWidth = Number(argv[++i] || args.browserWidth);
    else if (arg === '--browser-height') args.browserHeight = Number(argv[++i] || args.browserHeight);
    else if (arg === '--browser-x') args.browserX = Number(argv[++i] || args.browserX);
    else if (arg === '--browser-y') args.browserY = Number(argv[++i] || args.browserY);
    else if (arg === '--question' || arg === '-q') args.question = argv[++i] || '';
    else if (arg === '--no-start') args.noStart = true;
    else if (arg === '--fresh') args.fresh = true;
    else if (arg === '--temporary') args.temporary = true;
    else if (arg === '--no-brief') args.brief = false;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else args.question += `${args.question ? ' ' : ''}${arg}`;
  }

  return args;
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').trim();
}

function printHelp() {
  console.log(`Usage:
  node ask-gpt-chat.mjs --question "Analyze this problem"
  Get-Content error.log | node ask-gpt-chat.mjs --session bug-123

Options:
  --question, -q   Question to send
  --session        Conversation/session id
  --home           GPT-CHAT service project directory; can also be set with GPT_CHAT_HOME
  --api-url        Use a fixed API URL instead of runtime discovery
  --token          Override bearer token
  --instance       Runtime instance name, default gpt-chat
  --browser-port   Edge remote debugging port, default 9223
  --no-start       Fail if the service is not already running
  --fresh          Start a fresh normal ChatGPT conversation
  --temporary      Start a fresh temporary ChatGPT conversation
  --no-brief       Do not prepend concise-answer guidance`);
}

async function readRuntime(serviceRoot, instance) {
  const runtimeFile = path.join(serviceRoot, '.runtime', `${safeRuntimeName(instance)}-service.json`);
  return JSON.parse(await fsp.readFile(runtimeFile, 'utf8'));
}

function safeRuntimeName(value) {
  return String(value || DEFAULT_INSTANCE)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || DEFAULT_INSTANCE;
}

async function healthCheck(healthUrl, token) {
  try {
    const response = await fetch(healthUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function discoverRunningService(serviceRoot, token, instance) {
  try {
    const runtime = await readRuntime(serviceRoot, instance);
    if (runtime.healthUrl && runtime.askUrl && await healthCheck(runtime.healthUrl, token)) {
      return runtime.askUrl;
    }
  } catch {}
  return '';
}

function spawnDetached(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: 'ignore'
  });
  child.unref();
}

function spawnDetachedWithEnv(command, commandArgs, cwd, env) {
  const child = spawn(command, commandArgs, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
    env: { ...process.env, ...env }
  });
  child.unref();
}

async function ensureService(args) {
  if (args.apiUrl) return args.apiUrl;

  const running = await discoverRunningService(args.serviceRoot, args.token, args.instance);
  if (running) return running;

  if (args.noStart) throw new Error('GPT-CHAT service is not running and --no-start was set.');
  if (!args.serviceRoot) {
    throw new Error('GPT-CHAT service root not configured. Set GPT_CHAT_HOME or pass --home <service-project-directory>.');
  }
  if (!fs.existsSync(path.join(args.serviceRoot, 'package.json'))) {
    throw new Error(`GPT-CHAT service root not found: ${args.serviceRoot}. Set GPT_CHAT_HOME or pass --home <service-project-directory>.`);
  }

  const browserScript = path.join(args.serviceRoot, 'scripts', 'start-chatgpt-browser.ps1');
  spawnDetached('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    browserScript,
    '-Port',
    String(args.browserPort),
    '-ProfileDir',
    args.browserProfileDir,
    '-Width',
    String(args.browserWidth),
    '-Height',
    String(args.browserHeight),
    '-X',
    String(args.browserX),
    '-Y',
    String(args.browserY),
    '-Url',
    args.temporary ? 'https://chatgpt.com/?temporary-chat=true' : 'https://chatgpt.com/'
  ], args.serviceRoot);
  spawnDetachedWithEnv(process.execPath, ['src/server.js'], args.serviceRoot, {
    PORT: '0',
    GPT_CHAT_INSTANCE: safeRuntimeName(args.instance),
    GPT_CHAT_RUNTIME_NAME: safeRuntimeName(args.instance),
    CHATGPT_BROWSER_PORT: String(args.browserPort),
    CHATGPT_BROWSER_PROFILE_DIR: args.browserProfileDir,
    CHATGPT_BROWSER_ATTACH_ONLY: 'true',
    CHATGPT_BROWSER_HEADLESS: 'false'
  });

  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const askUrl = await discoverRunningService(args.serviceRoot, args.token, args.instance);
    if (askUrl) return askUrl;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('Timed out waiting for GPT-CHAT service to start.');
}

async function ask(apiUrl, token, sessionId, question, options = {}) {
  const finalQuestion = options.brief ? `${BRIEF_PREFIX}\n\n${question}` : question;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      sessionId,
      question: finalQuestion,
      reuse: !options.fresh && !options.temporary,
      temporary: Boolean(options.temporary)
    })
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    throw new Error(`GPT-CHAT request failed: HTTP ${response.status}\n${payload.message || JSON.stringify(payload, null, 2)}`);
  }
  return payload.answer || JSON.stringify(payload, null, 2);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const stdin = await readStdin();
const question = [args.question, stdin].filter(Boolean).join('\n\n').trim();
if (!question) {
  console.error('Missing question. Pass --question or pipe text to stdin.');
  process.exit(2);
}

try {
  const apiUrl = await ensureService(args);
  const answer = await ask(apiUrl, args.token, args.sessionId, question, {
    fresh: args.fresh,
    temporary: args.temporary,
    brief: args.brief
  });
  process.stdout.write(`${OUTPUT_PREFIX}${String(answer).trim()}${OUTPUT_SUFFIX}\n`);
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
