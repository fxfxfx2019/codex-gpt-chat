# codex-gpt-chat 使用说明

`codex-gpt-chat` 包含两个 Codex skills：

- `gpt-chat`：普通 ChatGPT 会话，保留上下文和记忆。
- `gpt-chat-temp`：temporary-chat 会话，隔离上下文。

## 使用动机

Codex 很适合读代码、改代码、跑命令和验证结果，但当前不能直接调用完整 ChatGPT 网页模型。人工在两个窗口之间复制粘贴，会导致：

- 操作繁琐；
- 上下文容易漏；
- 结果不容易回传给 Codex；
- 多轮分析时很难保持节奏。

这个 skill 的目标是让 Codex 在需要第二意见时，直接向本地 ChatGPT 网页会话提问，再由 Codex 自己判断、验证和执行。

## 工作原理

高层流程：

```text
Codex
  -> gpt-chat / gpt-chat-temp skill
  -> 本地 GPT-CHAT wrapper API
  -> 可见 ChatGPT 浏览器窗口
  -> ChatGPT 网页回答
  -> wrapper API 返回给 Codex
```

关键点：

- wrapper 服务运行在本机。
- 浏览器窗口是可见的，不默认 headless。
- 用户自己完成 ChatGPT 登录和验证。
- skill 不直接调用 ChatGPT 私有后端接口。
- skill 不绕过 CAPTCHA、Turnstile、Cloudflare 或登录校验。
- `.runtime/<instance>-service.json` 用于记录本地随机端口，方便脚本复用已运行服务。

## 为什么风险更小

相比直接逆向或调用未公开接口，这个方案更保守：

- 复用用户自己登录的 ChatGPT 网页；
- 不保存 ChatGPT 密码；
- 不接触浏览器 cookie 内容；
- 不绕过验证流程；
- 可以看到浏览器窗口里发生了什么；
- Codex 只拿到最终回答，仍然需要自行验证。

剩余风险：

- 你发送给 GPT 的内容会进入 ChatGPT 服务；
- 不应发送 secrets、tokens、private keys、cookies 或敏感业务数据；
- 本地 wrapper 服务和浏览器 profile 需要由用户自己保护。

## 安装

安装普通模式：

```text
从下面路径安装 Codex skill：
https://github.com/fxfxfx2019/codex-gpt-chat/tree/main/skills/gpt-chat
```

安装临时模式：

```text
从下面路径安装 Codex skill：
https://github.com/fxfxfx2019/codex-gpt-chat/tree/main/skills/gpt-chat-temp
```

安装后重启 Codex。

## 前置条件

你需要准备一个本地 GPT-CHAT wrapper 服务项目。该项目应包含：

- `package.json`
- `src/server.js`
- `scripts/start-chatgpt-browser.ps1`
- 服务启动后生成的 `.runtime/<instance>-service.json`

设置服务目录：

```powershell
Set-Item Env:GPT_CHAT_HOME "C:\path\to\gpt-chat-service"
```

Windows 下，如果 `GPT_CHAT_HOME` 写入的是用户级环境变量，已经打开的 Codex 进程可能不会自动继承。脚本会主动读取用户级 `GPT_CHAT_HOME`，所以设置后通常不需要重启 Codex。

也可以在运行脚本时传入：

```powershell
--home "C:\path\to\gpt-chat-service"
```

## gpt-chat 普通模式

适合：

- 希望保留 ChatGPT 上下文；
- 多轮复杂问题；
- 需要 ChatGPT 记住前面讨论；
- 需要持续第二意见。

触发示例：

```text
@gpt 帮我分析这个 bug
让 GPT-chat 回答一下
Use gpt-chat for a second opinion
```

手动调用：

```powershell
node "$env:USERPROFILE\.codex\skills\gpt-chat\scripts\ask-gpt-chat.mjs" `
  --session codex-second-opinion `
  --question "Analyze this issue and suggest a practical fix."
```

默认端口和 profile：

- CDP port：`9223`
- profile：`.chatgpt-browser-profile`

## gpt-chat-temp 临时模式

适合：

- 不希望历史上下文影响结果；
- 需要干净判断；
- 需要隔离分析；
- 不想让 ChatGPT memory 参与。

触发示例：

```text
@gpt-temp 独立分析一下
Use GPT temporary mode
```

手动调用：

```powershell
node "$env:USERPROFILE\.codex\skills\gpt-chat-temp\scripts\ask-gpt-chat-temp.mjs" `
  --session codex-temp-opinion `
  --question "Analyze this issue briefly."
```

默认端口和 profile：

- CDP port：`9224`
- profile：`.chatgpt-browser-profile-temp`
- temporary chat：开启
- fresh conversation：开启

## Codex 应如何使用回答

skill 会把 GPT 输出压缩成：

```text
gpt回复：“...”
```

但 Codex 不能直接照抄执行。正确流程是：

1. 读取 GPT 建议。
2. 回到本地代码和日志验证。
3. 判断建议是否成立。
4. 只执行有证据支持的修改。
5. 跑测试或验证命令。

## 排错

服务目录未配置：

```text
GPT-CHAT service root not configured.
```

处理方式：

```powershell
Set-Item Env:GPT_CHAT_HOME "C:\path\to\gpt-chat-service"
```

浏览器要求登录或验证：

- 在弹出的可见 ChatGPT 窗口里手动完成。
- 不要让 Codex 绕过验证。

服务已经运行：

- 脚本会优先读取 `.runtime/<instance>-service.json` 并复用现有服务。

## 重要提醒

这个项目提供的是 Codex skill 和 wrapper 调用脚本，不包含完整 GPT-CHAT wrapper 服务本体。使用者需要自行准备本地 wrapper 服务。
