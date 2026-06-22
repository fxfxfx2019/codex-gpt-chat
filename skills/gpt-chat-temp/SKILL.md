---
name: gpt-chat-temp
description: Ask the user's local GPT-CHAT service in ChatGPT temporary-chat mode for isolated second-opinion analysis without preserving ChatGPT context or memory. Use when the user says @gpt-temp, @GPT-TEMP, @GPT-CHAT-TEMP, asks for temporary GPT analysis, wants isolated analysis, or wants GPT-CHAT without relying on previous context.
---

# GPT-CHAT-TEMP

Use this skill to consult GPT-CHAT in temporary-chat mode. This is the isolated version of `$gpt-chat`; prefer it when prior ChatGPT context could affect the answer.

## Workflow

Call the bundled wrapper script:

```powershell
node "$env:USERPROFILE\.codex\skills\gpt-chat-temp\scripts\ask-gpt-chat-temp.mjs" `
  --session codex-temp-opinion `
  --question "Analyze this issue briefly: ..."
```

Set `GPT_CHAT_HOME` to the local GPT-CHAT wrapper service project directory, or pass `--home <service-project-directory>`. The wrapper calls the normal GPT-CHAT script with `--instance gpt-chat-temp --browser-port 9224 --browser-profile-dir .chatgpt-browser-profile-temp --temporary --fresh`. It uses its own runtime file and small visible browser window, so it can run in parallel with `$gpt-chat`.

Relay the result compactly:

```text
gpt回复：“...”
```

Do not narrate the skill invocation unless there is an error or the user asks for details.

## Safety

Do not send secrets, passwords, cookies, tokens, or unrelated private data to GPT-CHAT. Do not bypass CAPTCHA, Turnstile, Cloudflare, or other verification. If the temp browser profile is not logged in, the user must complete login or verification once in that small temp window.
