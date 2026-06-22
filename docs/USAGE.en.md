# codex-gpt-chat Usage Guide

`codex-gpt-chat` contains two Codex skills:

- `gpt-chat`: normal ChatGPT conversation with context and memory.
- `gpt-chat-temp`: temporary-chat conversation for isolated analysis.

## Motivation

Codex is strong at reading code, editing files, running commands, and verifying results, but it currently cannot directly call the full ChatGPT web model from a local coding task. Manually switching between Codex and ChatGPT is slow and error-prone.

This skill lets Codex ask a local ChatGPT web session for a second opinion, then Codex verifies the answer and decides what to execute.

## How It Works

High-level flow:

```text
Codex
  -> gpt-chat / gpt-chat-temp skill
  -> local GPT-CHAT wrapper API
  -> visible ChatGPT browser window
  -> ChatGPT web answer
  -> wrapper API returns the answer to Codex
```

Key properties:

- The wrapper service runs locally.
- The browser window is visible by default, not headless.
- The user completes ChatGPT login and verification manually.
- The skill does not call private ChatGPT backend endpoints directly.
- The skill does not bypass CAPTCHA, Turnstile, Cloudflare, or login checks.
- `.runtime/<instance>-service.json` records the random local service port so the script can reuse a running service.

## Why The Risk Is Lower

Compared with reverse-engineering private endpoints, this approach is more conservative:

- it reuses the user's own logged-in ChatGPT web session;
- it does not store the ChatGPT password;
- it does not inspect browser cookies;
- it does not bypass verification;
- the browser window is visible and user-controllable;
- Codex receives only the answer and must still verify it locally.

Remaining risks:

- content sent to GPT is sent to ChatGPT;
- do not send secrets, tokens, private keys, cookies, or sensitive business data;
- users must protect their local wrapper service and browser profile.

## Install

Install normal mode:

```text
Install the Codex skill from:
https://github.com/fxfxfx2019/codex-gpt-chat/tree/main/skills/gpt-chat
```

Install temporary mode:

```text
Install the Codex skill from:
https://github.com/fxfxfx2019/codex-gpt-chat/tree/main/skills/gpt-chat-temp
```

Restart Codex after installation.

## Prerequisites

You need a local GPT-CHAT wrapper service project. It should contain:

- `package.json`
- `src/server.js`
- `scripts/start-chatgpt-browser.ps1`
- `.runtime/<instance>-service.json` after the service starts

Set the service directory:

```powershell
Set-Item Env:GPT_CHAT_HOME "C:\path\to\gpt-chat-service"
```

Or pass it per invocation:

```powershell
--home "C:\path\to\gpt-chat-service"
```

## gpt-chat Normal Mode

Use this when:

- ChatGPT context is useful;
- the task needs multi-turn reasoning;
- you want memory/context preserved;
- you want ongoing second-opinion analysis.

Trigger examples:

```text
@gpt analyze this bug
Use gpt-chat for a second opinion
```

Manual command:

```powershell
node "$env:USERPROFILE\.codex\skills\gpt-chat\scripts\ask-gpt-chat.mjs" `
  --session codex-second-opinion `
  --question "Analyze this issue and suggest a practical fix."
```

Defaults:

- CDP port: `9223`
- profile: `.chatgpt-browser-profile`

## gpt-chat-temp Temporary Mode

Use this when:

- prior context should not affect the answer;
- a clean judgment is needed;
- analysis should be isolated;
- ChatGPT memory should not participate.

Trigger examples:

```text
@gpt-temp analyze this in isolation
Use GPT temporary mode
```

Manual command:

```powershell
node "$env:USERPROFILE\.codex\skills\gpt-chat-temp\scripts\ask-gpt-chat-temp.mjs" `
  --session codex-temp-opinion `
  --question "Analyze this issue briefly."
```

Defaults:

- CDP port: `9224`
- profile: `.chatgpt-browser-profile-temp`
- temporary chat: enabled
- fresh conversation: enabled

## How Codex Should Use The Answer

The skill returns GPT output compactly:

```text
gpt回复：“...”
```

Codex should not blindly execute it. Correct workflow:

1. Read GPT advice.
2. Verify it against local code and logs.
3. Decide whether it is valid.
4. Apply only justified changes.
5. Run tests or verification commands.

## Troubleshooting

Service root not configured:

```text
GPT-CHAT service root not configured.
```

Fix:

```powershell
Set-Item Env:GPT_CHAT_HOME "C:\path\to\gpt-chat-service"
```

Browser asks for login or verification:

- Complete it manually in the visible ChatGPT window.
- Do not ask Codex to bypass verification.

Service already running:

- The script reads `.runtime/<instance>-service.json` and reuses it.

## Important Note

This repository contains Codex skills and wrapper call scripts. It does not include the complete GPT-CHAT wrapper service itself. Users must provide their own local wrapper service.
