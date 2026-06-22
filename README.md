# codex-gpt-chat

`codex-gpt-chat` 是一组给 Codex 使用的 skills，用来把 Codex 和你本地已登录的 ChatGPT 网页会话连接起来。

## 为什么做这个

Codex 当前不能在本地任务中直接调用“满血版”GPT/ChatGPT 网页模型。手动在 Codex 和 ChatGPT 网页之间来回复制、切换窗口又很麻烦，也容易丢上下文。

所以这里做了两个 Codex skill：

- `gpt-chat`：使用普通 ChatGPT 会话，保留上下文和记忆，适合连续讨论和复杂问题复盘。
- `gpt-chat-temp`：使用 ChatGPT temporary-chat 模式，隔离上下文，适合需要干净分析的第二意见。

## 原理

这个方案不是直接调用 ChatGPT 后端接口，也不绕过登录、验证码、Cloudflare 或 Turnstile。

基本流程是：

1. 用户本地准备一个 GPT-CHAT wrapper 服务项目。
2. skill 脚本读取 `GPT_CHAT_HOME` 或 `--home` 找到这个本地服务。
3. 如果服务没运行，脚本启动一个小的可见浏览器窗口，并通过 CDP 连接到这个窗口。
4. 用户仍然使用自己登录过的 ChatGPT 网页会话。
5. 本地 wrapper 服务把 Codex 的问题投递到 ChatGPT 网页，再把网页回答返回给 Codex。
6. `gpt-chat` 和 `gpt-chat-temp` 使用不同 instance、端口和浏览器 profile，可以并行运行。

这种方式的风险系数更小，因为它尽量复用用户自己可见、可控制的 ChatGPT 网页环境，不硬碰未公开后端接口，不保存用户密码，也不试图绕过验证流程。

## 安装

让 Codex 分别安装需要的 skill：

```text
从下面路径安装 Codex skill：
https://github.com/fxfxfx2019/codex-gpt-chat/tree/main/skills/gpt-chat
```

```text
从下面路径安装 Codex skill：
https://github.com/fxfxfx2019/codex-gpt-chat/tree/main/skills/gpt-chat-temp
```

安装后重启 Codex。

## 前置条件

你需要有一个本地 GPT-CHAT wrapper 服务项目，并设置：

```powershell
Set-Item Env:GPT_CHAT_HOME "C:\path\to\gpt-chat-service"
```

详细说明见：

- [中文使用说明](docs/USAGE.zh-CN.md)
- [English Guide](docs/USAGE.en.md)

## 安全边界

- 不发送 secrets、passwords、cookies、tokens、private keys。
- 不绕过 CAPTCHA、Turnstile、Cloudflare 或登录验证。
- GPT 的回答只作为建议，Codex 必须自己验证后再执行。
- 本方案依赖用户本地浏览器登录态，是否合规使用取决于用户自己的 ChatGPT 账号和使用场景。

## 仓库结构

```text
skills/
  gpt-chat/
    SKILL.md
    agents/openai.yaml
    scripts/ask-gpt-chat.mjs
  gpt-chat-temp/
    SKILL.md
    agents/openai.yaml
    scripts/ask-gpt-chat-temp.mjs
docs/
  USAGE.zh-CN.md
  USAGE.en.md
```
