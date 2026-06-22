#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseScript = path.resolve(__dirname, '..', '..', 'gpt-chat', 'scripts', 'ask-gpt-chat.mjs');

const args = [
  baseScript,
  '--instance',
  'gpt-chat-temp',
  '--browser-port',
  '9224',
  '--browser-profile-dir',
  '.chatgpt-browser-profile-temp',
  '--browser-width',
  '460',
  '--browser-height',
  '640',
  '--browser-x',
  '500',
  '--browser-y',
  '20',
  '--temporary',
  '--fresh',
  ...process.argv.slice(2)
];
const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  windowsHide: true
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
