# TASK: Channel Talk OpenClaw Plugin

## Goal
Build an OpenClaw channel plugin for Channel Talk (채널톡) that enables AI to receive and respond to **Team Chat** messages via webhooks.

## Scope
- **Team Chat only** (not User Chat/customer chat)
- Receive messages via Channel Talk Webhook API
- Send messages via Channel Talk Open API v5
- Follow OpenClaw plugin architecture (see MS Teams plugin as reference)

## Architecture

### Authentication
- Channel Talk Open API uses `x-access-key` + `x-access-secret` headers
- Keys are created in Channel Desk → Settings → API Key management

### Message Flow
1. **Inbound**: Channel Talk sends webhook POST to our endpoint when `message.created.teamChat` event occurs
2. **OpenClaw processes** the message through the AI agent
3. **Outbound**: Plugin sends response via `POST /open/v5/groups/{groupId}/messages`

### Key APIs (from swagger in `ref/channel-swagger.json`)

#### Webhook Management
- `POST /open/v5/webhooks` — Create webhook (returns `token` for verification)
- `GET /open/v5/webhooks` — List webhooks
- `PATCH /open/v5/webhooks/{id}` — Update webhook
- `DELETE /open/v5/webhooks/{id}` — Delete webhook

#### Team Chat (Groups)
- `GET /open/v5/groups` — List team chats
- `GET /open/v5/groups/{groupId}` — Get team chat
- `GET /open/v5/groups/{groupId}/messages` — Get messages in chat
- `POST /open/v5/groups/{groupId}/messages` — Send message to chat
  - Body: `{ plainText: "...", options: ["actAsManager"] }`
- `GET /open/v5/groups/@{groupName}/messages` — Get messages by group name

#### Managers
- `GET /open/v5/managers` — List managers (to identify bot vs human)

#### Bots
- `POST /open/v5/bots` — Create/update bot
- `GET /open/v5/bots` — List bots

### Webhook Event Scopes
- `message.created.teamChat` — New message in team chat (PRIMARY)
- `message.created.userChat` — New message in user chat (NOT IN SCOPE)

## Plugin Structure

```
openclaw-channel-talk/
├── openclaw.plugin.json     # Plugin manifest
├── package.json             # Dependencies
├── tsconfig.json
├── index.ts                 # Entry point: api.registerChannel()
├── src/
│   ├── channel.ts           # ChannelPlugin implementation
│   ├── config-schema.ts     # Config JSON Schema (TypeBox)
│   ├── webhook.ts           # Webhook HTTP handler + event parsing
│   ├── send.ts              # Message sending (outbound)
│   ├── api-client.ts        # Channel Talk REST API client
│   └── types.ts             # TypeScript types
└── ref/
    └── channel-swagger.json # API reference
```

## Config Schema

```json
{
  "channels": {
    "channel-talk": {
      "enabled": true,
      "accessKey": "<ACCESS_KEY>",
      "accessSecret": "<ACCESS_SECRET>",
      "webhook": {
        "port": 3979,
        "path": "/api/channel-talk"
      }
    }
  }
}
```

## Reference Implementation
- **MS Teams plugin**: `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/`
  - `index.ts` — Entry point pattern
  - `src/channel.ts` — ChannelPlugin interface implementation
  - `src/send.ts` — Message sending pattern
- **OpenClaw plugin docs**: `/home/happycastle/nodejs/lib/node_modules/openclaw/docs/plugin.md`
- **Plugin manifest**: `/home/happycastle/nodejs/lib/node_modules/openclaw/docs/plugins/manifest.md`
- **Agent tools**: `/home/happycastle/nodejs/lib/node_modules/openclaw/docs/plugins/agent-tools.md`

## Implementation Steps
1. Set up project scaffolding (package.json, tsconfig, manifest)
2. Implement API client for Channel Talk REST API
3. Implement webhook handler (HTTP endpoint + event parsing)
4. Implement message sending (outbound)
5. Wire up ChannelPlugin interface
6. Auto-register webhook on plugin start
7. Test with real Channel Talk instance

## Important Notes
- Use TypeBox (`@sinclair/typebox`) for schema definitions (like MS Teams plugin)
- Import from `openclaw/plugin-sdk` for types
- Plugin runs in-process with Gateway
- Webhook needs a public URL (Tailscale Funnel or similar)
- The `token` field returned from webhook creation is used for request verification
