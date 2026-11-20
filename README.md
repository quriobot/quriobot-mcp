# Quriobot MCP

Work with your Quriobot account from any AI agent: answer live chats, read responses and contacts,
look into a bot's settings, anything you do in [control.quriobot.com](https://control.quriobot.com).
This is an [MCP](https://modelcontextprotocol.io) server over the Quriobot API, which is what
control.quriobot.com itself runs on, acting with your own API key. It runs on your machine,
needs Node.js 18 or later, and has no dependencies.

Every setup below runs it the recommended way, `npx -y @quriobot/mcp@latest`: npx fetches the
newest release when your agent starts the server, so updates reach you without doing anything.

## Your API key

In control.quriobot.com, open **Profile → API keys** and create a key. It acts as you, in every
organisation you are a member of. You can delete it there at any time, and the list shows when it
was last used. Every setup below gives it to the server as `QURIOBOT_API_KEY`.

## Setup

### Claude Code

The plugin runs `npx -y @quriobot/mcp@latest` too. It asks for the key while installing and keeps it in
Claude Code's credential store (the macOS keychain, or `~/.claude/.credentials.json`), not in a
settings file:

```
/plugin marketplace add quriobot/quriobot-mcp
/plugin install quriobot@quriobot
```

To change the key later: `/plugin configure quriobot@quriobot`. From a script, without the key in
your shell history:

```bash
claude plugin marketplace add quriobot/quriobot-mcp
claude plugin install quriobot@quriobot
jq -Rn --rawfile k /path/to/key-file '{api_key: ($k | rtrimstr("\n"))}' \
  | claude plugin configure quriobot@quriobot --values-stdin
```

### VS Code (GitHub Copilot)

In `.vscode/mcp.json`; VS Code asks for the key once and stores it securely:

```json
{
  "inputs": [{ "type": "promptString", "id": "quriobot-key", "description": "Quriobot API key", "password": true }],
  "servers": {
    "quriobot": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@quriobot/mcp@latest"],
      "env": { "QURIOBOT_API_KEY": "${input:quriobot-key}" }
    }
  }
}
```

### Claude Desktop, Cursor, Gemini CLI and other clients

They take the same entry under `mcpServers`: Claude Desktop in `claude_desktop_config.json`
(Settings → Developer → Edit Config), Cursor in `~/.cursor/mcp.json`, Gemini CLI in
`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "quriobot": {
      "command": "npx",
      "args": ["-y", "@quriobot/mcp@latest"],
      "env": { "QURIOBOT_API_KEY": "your API key" }
    }
  }
}
```

### Codex

In `~/.codex/config.toml`:

```toml
[mcp_servers.quriobot]
command = "npx"
args = ["-y", "@quriobot/mcp@latest"]
env = { QURIOBOT_API_KEY = "your API key" }
```

These files hold the key in plain text: keep them out of version control.

## Tools

| Tool | What it does |
|---|---|
| `find_endpoints` | Searches the API's [public specification](https://api.quriobot.com/swagger.json) by words, e.g. "chat messages" |
| `describe_endpoint` | The parameters, request body and responses of one endpoint |
| `read` | A GET, or a POST to a list (`…/list`). Changes nothing |
| `write` | POST, PATCH, PUT or DELETE: sends a chat message, closes a chat, changes a bot |

Reading and writing are separate tools, so you can let the agent read freely and still approve
every change. In Claude Code, for example, in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["mcp__plugin_quriobot_quriobot__find_endpoints", "mcp__plugin_quriobot_quriobot__describe_endpoint", "mcp__plugin_quriobot_quriobot__read"],
    "ask": ["mcp__plugin_quriobot_quriobot__write"]
  }
}
```

Other clients ask before each tool call by default, or let you allow tools one by one.

## Good to know

- Almost every call needs your organisation's id. Ask the agent to find it, or copy it from
  control.quriobot.com: it is the part of the address after the host.
- Bulk actions (closing, assigning or marking chats as spam) act on everything their filters
  select unless they name the chats by id. The server tells the agent this; approving writes
  yourself lets you check each one.
- Chats and contacts contain what other people wrote. The agent is told to treat that as data,
  not as instructions, but approving writes yourself is the safe default.
- `QURIOBOT_API_URL` points the server at another Quriobot API, such as a development stack.

## License

MIT
