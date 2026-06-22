---
name: gpt-chat
description: Ask the user's local GPT-CHAT service for second-opinion analysis through the ChatGPT web wrapper API using the normal non-temporary ChatGPT URL and preserving ChatGPT context/memory. Use when the user says @gpt, @GPT, @GPT-CHAT, "让GPT-chat回答", asks to consult GPT, wants another model to analyze a hard bug/design/problem, or wants GPT to propose reasoning while Codex remains responsible for verifying and executing changes.
---

# GPT-CHAT

Use this skill to consult the user's local ChatGPT web wrapper API as a second-opinion analyst. Treat GPT-CHAT output as advice: inspect the codebase yourself, verify claims, and execute only justified changes.

## Workflow

Call the bundled script:

```powershell
node "$env:USERPROFILE\.codex\skills\gpt-chat\scripts\ask-gpt-chat.mjs" `
  --session codex-second-opinion `
  --question "Analyze this issue and suggest a practical fix: ..."
```

Set `GPT_CHAT_HOME` to the local GPT-CHAT wrapper service project directory, or pass `--home <service-project-directory>`. The script discovers the random local API port from `.runtime/gpt-chat-service.json`. If the normal service is not running, it starts a small visible ChatGPT browser helper on CDP port `9223` and the API service. If it is already running, it reuses them.

Default behavior uses the normal ChatGPT URL (`https://chatgpt.com/`) and reuses context. It can run alongside `$gpt-chat-temp`, which uses a separate runtime file, CDP port `9224`, and browser profile. Pass `--fresh` only when a clean normal conversation is needed. Do not pass `--temporary`; use `$gpt-chat-temp` for temporary-chat mode.

Relay the result compactly:

```text
gpt回复：“...”
```

Do not narrate the skill invocation unless there is an error or the user asks for details.

## Query Guidance

Send concise but sufficient context: user goal, observed failure, relevant file paths/functions/logs, and constraints. Do not send secrets, private tokens, passwords, cookies, or unrelated personal data.

## Failure Handling

If the service fails to start, ask the user to unlock the ChatGPT browser profile or start:

```powershell
Set-Item Env:GPT_CHAT_HOME "C:\path\to\gpt-chat-service"
npm run browser:chatgpt
npm start
```

Do not bypass CAPTCHA, Turnstile, Cloudflare, or other verification. Do not call ChatGPT backend endpoints directly. Use the local wrapper only; it drives the logged-in web UI and reuses the existing debugging browser. Keep the visible browser window small; do not use headless mode by default.
