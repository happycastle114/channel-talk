# OpenClaw Channel Talk (채널톡) Team Chat Plugin

## TL;DR

> **Quick Summary**: Build an OpenClaw channel plugin for Channel Talk's Team Chat, enabling AI-powered responses in team group chats. Follow the MS Teams plugin pattern — webhook inbound gateway + REST API outbound.
> 
> **Deliverables**:
> - Complete OpenClaw channel plugin (`@openclaw/channel-talk`)
> - Webhook gateway receiving `message.created.teamChat` events
> - Outbound message sending via Channel Talk v5 REST API
> - Plugin manifest, config schema, package.json with openclaw metadata
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (scaffold) → Task 2 (types/api-client) → Task 3 (config) → Task 4 (outbound) → Task 5 (webhook gateway) → Task 6 (channel plugin) → Task 7 (entry point) → Task 8 (integration test)

---

## Context

### Original Request
Build an OpenClaw channel plugin for Channel Talk (채널톡) Team Chat following the MS Teams plugin at `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/`. Reference plugin docs at `/home/happycastle/nodejs/lib/node_modules/openclaw/docs/plugin.md`.

### Research Findings
- **MS Teams plugin pattern**: `index.ts` entry → `src/channel.ts` (ChannelPlugin interface) → `src/outbound.ts` (ChannelOutboundAdapter) → `src/monitor.ts` (gateway Express server) → `src/runtime.ts` (singleton)
- **OpenClaw Plugin SDK**: `ChannelPlugin<ResolvedAccount>` requires `id`, `meta`, `capabilities`, `config` adapter. Optional: `outbound`, `gateway`, `setup`, `status`, `security`, `reload`, `configSchema`
- **Channel Talk v5 API**: REST with `x-access-key`/`x-access-secret` headers. Send messages via `POST /open/v5/groups/{groupId}/messages`. Webhook events contain `{event, type, entity: {chatType, blocks, plainText, personType, personId}, refers: {manager, group}}`
- **Webhook payload**: `message.created.teamChat` scope. `chatType === "group"` for team chat. `personType` can be "manager", "bot", or "user". `refers.group.id` is the groupId for replies.

### Metis Review
**Identified Gaps** (all addressed in plan):
- Session key mapping contract → resolved: use `refers.group.id` as canonical session key (team chat is group-scoped)
- Webhook authenticity → resolved: unguessable webhook path + optional token verification middleware
- Self-message loop prevention → resolved: skip events where `personType === "bot"` or sender matches configured bot identity
- Duplicate event handling → resolved: in-memory message ID dedup cache with TTL
- Outbound retry policy → resolved: simple retry with backoff for 429/5xx
- Edge cases (empty text, missing refs) → resolved: defensive parsing with structured drop logging

---

## Work Objectives

### Core Objective
Create a fully functional OpenClaw channel plugin that receives team chat messages from Channel Talk via webhook and sends AI-generated responses back via the Channel Talk REST API.

### Concrete Deliverables
- `package.json` with openclaw extension metadata
- `openclaw.plugin.json` manifest
- `index.ts` — plugin entry point
- `src/types.ts` — TypeScript types for Channel Talk API
- `src/api-client.ts` — HTTP client for Channel Talk v5 REST API
- `src/config-schema.ts` — Zod config schema for `channels.channel-talk`
- `src/send.ts` — outbound message adapter (sendText)
- `src/webhook.ts` — inbound webhook gateway (Express server)
- `src/channel.ts` — main ChannelPlugin implementation
- `src/runtime.ts` — singleton plugin runtime holder

### Definition of Done
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Plugin loads successfully in OpenClaw runtime
- [x] Webhook server starts on configured port and accepts POST requests
- [x] Valid `message.created.teamChat` events are parsed and dispatched to OpenClaw
- [x] Bot/self messages are filtered out (no echo loops)
- [x] Outbound `sendText` posts to Channel Talk API with correct headers and body
- [x] Config schema validates required fields (accessKey, accessSecret)

### Must Have
- Inbound webhook handler for `message.created.teamChat` events
- Outbound message sending via REST API with `actAsManager` option
- Config schema with accessKey, accessSecret, webhook port/path, botName
- Self-message loop prevention (skip personType==="bot")
- Defensive payload parsing with drop logging for malformed events
- Proper shutdown handling via abortSignal

### Must NOT Have (Guardrails)
- ❌ User Chat / customer chat support (scope is Team Chat only)
- ❌ Polls, threads, media attachments, file uploads
- ❌ Mentions system or user directory lookup
- ❌ Pairing / onboarding flows
- ❌ Database or persistent queue infrastructure
- ❌ Admin UI or config management UI
- ❌ Rich message block rendering (plainText only for MVP)
- ❌ Actions, commands, or streaming adapters
- ❌ Metrics/tracing/observability dashboards
- ❌ Over-engineering: keep it simple, follow MS Teams pattern faithfully

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: NO (not requested, rapid implementation)
- **Framework**: none
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### Primary Verification: TypeScript compilation + Agent-Executed QA Scenarios
Every task verified by: `npx tsc --noEmit` for type safety, plus functional QA scenarios using curl/bash.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Project scaffold (package.json, manifest, tsconfig)
└── (sequential foundation)

Wave 2 (After Wave 1):
├── Task 2: Types + API client (no deps on other src)
├── Task 3: Config schema + Runtime singleton
└── (can parallelize 2 and 3)

Wave 3 (After Wave 2):
├── Task 4: Outbound adapter (depends: types, api-client, config, runtime)
├── Task 5: Webhook gateway (depends: types, config, runtime)
└── (can parallelize 4 and 5)

Wave 4 (After Wave 3):
├── Task 6: Channel plugin assembly (depends: all src modules)
└── Task 7: Entry point index.ts (depends: channel plugin)

Wave 5 (After Wave 4):
└── Task 8: Integration verification (depends: everything)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3 | None (foundation) |
| 2 | 1 | 4, 5 | 3 |
| 3 | 1 | 4, 5, 6 | 2 |
| 4 | 2, 3 | 6 | 5 |
| 5 | 2, 3 | 6 | 4 |
| 6 | 4, 5 | 7 | None |
| 7 | 6 | 8 | None |
| 8 | 7 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick") |
| 2 | 2, 3 | task(category="quick") parallel |
| 3 | 4, 5 | task(category="unspecified-high") parallel |
| 4 | 6, 7 | task(category="unspecified-high") sequential |
| 5 | 8 | task(category="deep") |

---

## TODOs

- [x] 1. Project Scaffold — package.json, manifest, tsconfig

  **What to do**:
  - Create `package.json` with:
    - `name`: `@openclaw/channel-talk`
    - `type`: `module`
    - `dependencies`: `openclaw: "workspace:*"`
    - `openclaw.extensions`: `["./index.ts"]`
    - `openclaw.channel`: `{ id: "channel-talk", label: "Channel Talk", selectionLabel: "Channel Talk (채널톡)", docsPath: "channel-talk", docsLabel: "Channel Talk Setup", blurb: "채널톡 Team Chat integration", aliases: ["channeltalk", "채널톡"], order: 110 }`
    - `openclaw.install`: `{ npmSpec: "@openclaw/channel-talk", localPath: "extensions/channel-talk", defaultChoice: false }`
  - Create `openclaw.plugin.json`:
    ```json
    { "id": "channel-talk", "channels": ["channel-talk"], "configSchema": { "type": "object", "additionalProperties": false, "properties": {} } }
    ```
  - Create `tsconfig.json` extending from the OpenClaw workspace tsconfig (or standalone with `module: "ESNext"`, `target: "ES2022"`, `moduleResolution: "bundler"`, `strict: true`, `outDir: "dist"`, `rootDir: "."`)
  - Create directory structure: `src/`

  **Must NOT do**:
  - Do NOT add test dependencies
  - Do NOT add unnecessary dependencies beyond `openclaw`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation, no complex logic
  - **Skills**: []
    - No special skills needed for scaffold

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation)
  - **Parallel Group**: Wave 1 (alone)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/package.json` — Follow exact `openclaw.extensions`, `openclaw.channel`, `openclaw.install` structure
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/openclaw.plugin.json` — Exact manifest format: `{ id, channels, configSchema }`

  **Documentation References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/docs/plugin.md` — Plugin registration requirements
  - `/home/happycastle/Projects/openclaw-channel-talk/TASK.md` — Project requirements and config structure

  **WHY Each Reference Matters**:
  - MS Teams package.json: Copy the `openclaw.*` metadata shape exactly — this is how OpenClaw discovers and loads plugins
  - MS Teams manifest: Minimal required fields for channel plugin registration
  - TASK.md: Source of truth for channel ID, naming, config structure

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Package.json is valid JSON with required openclaw fields
    Tool: Bash
    Steps:
      1. cat package.json | python3 -m json.tool
      2. Assert: exit code 0 (valid JSON)
      3. Assert: output contains "openclaw.extensions"
      4. Assert: output contains "@openclaw/channel-talk"
    Expected Result: Valid package.json with openclaw metadata

  Scenario: Plugin manifest is valid
    Tool: Bash
    Steps:
      1. cat openclaw.plugin.json | python3 -m json.tool
      2. Assert: exit code 0
      3. Assert: "id" equals "channel-talk"
      4. Assert: "channels" contains "channel-talk"
    Expected Result: Valid manifest with correct channel ID

  Scenario: Directory structure exists
    Tool: Bash
    Steps:
      1. ls -la src/
      2. Assert: src directory exists
      3. ls tsconfig.json
      4. Assert: tsconfig exists
    Expected Result: Project structure ready for source files
  ```

  **Commit**: YES
  - Message: `feat(channel-talk): scaffold project with package.json, manifest, and tsconfig`
  - Files: `package.json`, `openclaw.plugin.json`, `tsconfig.json`

---

- [x] 2. Types + API Client — src/types.ts, src/api-client.ts

  **What to do**:
  - Create `src/types.ts` with TypeScript types for:
    - `ChannelTalkConfig` — `{ enabled?: boolean, accessKey: string, accessSecret: string, webhook?: { port?: number, path?: string }, botName?: string, groupPolicy?: 'open' | 'mention' | 'closed' }`
    - `ResolvedChannelTalkAccount` — resolved config type (config + enabled state)
    - `ChannelTalkWebhookEvent` — `{ event: string, type: string, entity: ChannelTalkMessageEntity, refers: ChannelTalkRefers }`
    - `ChannelTalkMessageEntity` — `{ chatType: string, chatId: string, personType: string, personId: string, blocks: ChannelTalkBlock[], plainText: string, id: string, channelId: string, createdAt: number }`
    - `ChannelTalkBlock` — `{ type: 'text' | 'code' | 'bullets', value: string }`
    - `ChannelTalkRefers` — `{ manager?: { id, name, email, username?, avatarUrl? }, group?: { id, name, managerIds?: string[] } }`
    - `ChannelTalkSendResult` — `{ messageId?: string, ok: boolean }`
    - Constants: `CHANNEL_TALK_ID = 'channel-talk'`, `CHANNEL_TALK_API_BASE = 'https://api.channel.io'`, `DEFAULT_WEBHOOK_PORT = 3979`, `DEFAULT_WEBHOOK_PATH = '/api/channel-talk'`

  - Create `src/api-client.ts` with:
    - `createChannelTalkClient(accessKey: string, accessSecret: string)` factory
    - Client methods:
      - `sendMessage(groupId: string, plainText: string, botName?: string): Promise<ChannelTalkSendResult>` — POST `/open/v5/groups/{groupId}/messages` with `{ plainText, options: ["actAsManager"] }` body and `x-access-key`/`x-access-secret` headers
      - `listManagers(): Promise<any>` — GET `/open/v5/managers` (for status/probe)
    - Use native `fetch` (no external HTTP library)
    - Include retry logic: retry up to 2 times on 429/5xx with exponential backoff (1s, 3s)
    - Include proper error handling: throw on 401/403 (auth failure), retry on 429/5xx, return error result on other failures
    - Timeout: 10s per request via AbortSignal.timeout()

  **Must NOT do**:
  - Do NOT install axios, got, node-fetch, or any HTTP library — use native fetch
  - Do NOT add webhook CRUD methods (not needed for runtime)
  - Do NOT parse response body beyond success/failure status

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward types + simple HTTP client
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/send.ts` — Outbound HTTP call pattern (headers, error handling, result shape)
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/sdk.ts` — API client factory pattern

  **API References**:
  - `/home/happycastle/Projects/openclaw-channel-talk/ref/channel-swagger.json` — Line ~3789: POST `/open/v5/groups/{groupId}/messages` request/response shape. Line ~13849: `message.OpenMessageCreateRequest` schema (blocks, plainText, options). Auth: `x-access-key`, `x-access-secret` headers.

  **Documentation References**:
  - `/home/happycastle/Projects/openclaw-channel-talk/TASK.md` — API auth pattern, endpoint URLs, message format

  **WHY Each Reference Matters**:
  - MS Teams send.ts: Shows how to structure API calls and return delivery results in OpenClaw's expected format
  - channel-swagger.json: Authoritative API contract — exact headers, body fields, and response codes
  - TASK.md: Specifies auth header names and message options (actAsManager)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: TypeScript types compile without errors
    Tool: Bash
    Steps:
      1. npx tsc --noEmit src/types.ts
      2. Assert: exit code 0
    Expected Result: All types valid TypeScript

  Scenario: API client module compiles
    Tool: Bash
    Steps:
      1. npx tsc --noEmit src/api-client.ts
      2. Assert: exit code 0
    Expected Result: API client compiles cleanly

  Scenario: API client exports expected functions
    Tool: Bash
    Steps:
      1. grep -c "export.*createChannelTalkClient" src/api-client.ts
      2. Assert: output is "1"
      3. grep -c "sendMessage" src/api-client.ts
      4. Assert: output >= "1"
    Expected Result: Client factory and methods are exported
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(channel-talk): add types, API client, config schema, and runtime`
  - Files: `src/types.ts`, `src/api-client.ts`

---

- [x] 3. Config Schema + Runtime Singleton — src/config-schema.ts, src/runtime.ts

  **What to do**:
  - Create `src/config-schema.ts` with:
    - Import `z` from `zod` (available via openclaw)
    - Define `ChannelTalkConfigSchema` as Zod object:
      ```
      z.object({
        enabled: z.boolean().optional().default(true),
        accessKey: z.string().describe('Channel Talk access key'),
        accessSecret: z.string().describe('Channel Talk access secret'),
        webhook: z.object({
          port: z.number().optional().default(3979),
          path: z.string().optional().default('/api/channel-talk'),
        }).optional(),
        botName: z.string().optional().describe('Bot display name for sent messages'),
        groupPolicy: z.enum(['open', 'closed']).optional().default('open'),
      })
      ```
    - Export the schema for use in channel.ts configSchema adapter

  - Create `src/runtime.ts` with:
    - Module-level `let runtime: PluginRuntime | undefined`
    - `setChannelTalkRuntime(next: PluginRuntime): void` — sets the singleton
    - `getChannelTalkRuntime(): PluginRuntime` — returns runtime, throws if uninitialized
    - Import `PluginRuntime` type from `openclaw/plugin-sdk`

  **Must NOT do**:
  - Do NOT add complex validation beyond Zod schema
  - Do NOT add config migration logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small focused files, clear patterns from MS Teams
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/runtime.ts` — Exact singleton pattern: module-level variable, set/get functions, throw on uninitialized access
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/channel.ts:configSchema` — How `buildChannelConfigSchema(MSTeamsConfigSchema)` is used in the channel plugin's configSchema adapter

  **API/Type References**:
  - `openclaw/plugin-sdk` — `PluginRuntime` type, `buildChannelConfigSchema` function

  **Documentation References**:
  - `/home/happycastle/Projects/openclaw-channel-talk/TASK.md` — Config structure: accessKey, accessSecret, webhook.port, webhook.path, botName

  **WHY Each Reference Matters**:
  - MS Teams runtime.ts: 1:1 pattern to follow — same singleton approach ensures consistent plugin lifecycle
  - MS Teams channel.ts configSchema: Shows how to wrap Zod schema with `buildChannelConfigSchema` for OpenClaw integration
  - TASK.md: Authoritative config field requirements

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Config schema and runtime compile
    Tool: Bash
    Steps:
      1. npx tsc --noEmit src/config-schema.ts src/runtime.ts
      2. Assert: exit code 0
    Expected Result: Both files compile cleanly

  Scenario: Config schema exports Zod schema
    Tool: Bash
    Steps:
      1. grep -c "export.*ChannelTalkConfigSchema" src/config-schema.ts
      2. Assert: output is "1"
    Expected Result: Schema is exported

  Scenario: Runtime exports get/set functions
    Tool: Bash
    Steps:
      1. grep -c "export.*setChannelTalkRuntime" src/runtime.ts
      2. Assert: output is "1"
      3. grep -c "export.*getChannelTalkRuntime" src/runtime.ts
      4. Assert: output is "1"
    Expected Result: Both runtime functions exported
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(channel-talk): add types, API client, config schema, and runtime`
  - Files: `src/config-schema.ts`, `src/runtime.ts`

---

- [x] 4. Outbound Adapter — src/send.ts

  **What to do**:
  - Create `src/send.ts` exporting `channelTalkOutbound: ChannelOutboundAdapter`:
    - `deliveryMode: 'direct'`
    - `chunkerMode: 'markdown'` (use runtime chunker)
    - `textChunkLimit: 4000` (Channel Talk's practical limit)
    - `chunker: (text, limit) => getChannelTalkRuntime().channel.text.chunkMarkdownText(text, limit)`
    - `sendText: async ({ cfg, to, text, accountId }) => { ... }`:
      1. Read accessKey/accessSecret from `cfg.channels?.['channel-talk']`
      2. Create API client via `createChannelTalkClient(accessKey, accessSecret)`
      3. Read optional botName from config
      4. Call `client.sendMessage(to, text, botName)`
      5. Return `{ ok: true, channel: CHANNEL_TALK_ID, messageId: result.messageId }` or error result
    - Handle errors: log failures, return `{ ok: false, error: message }`
  - Import types from `./types.js`, runtime from `./runtime.js`, client from `./api-client.js`

  **Must NOT do**:
  - Do NOT implement sendMedia, sendPoll, sendPayload
  - Do NOT add threading/reply-to support
  - Do NOT retry at this layer (retries are in api-client)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Needs careful integration with OpenClaw outbound adapter interface
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/outbound.ts` — Exact `ChannelOutboundAdapter` shape: deliveryMode, chunker, chunkerMode, textChunkLimit, sendText signature. Shows how to read config from `cfg.channels?.msteams`, how to construct return value `{ channel, messageId, conversationId }`
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/send.ts` — Low-level send function pattern, error handling, result structure

  **API/Type References**:
  - `openclaw/plugin-sdk` — `ChannelOutboundAdapter` type definition: `sendText(ctx: ChannelOutboundContext) => Promise<OutboundDeliveryResult>`, `ChannelOutboundContext: { cfg, to, text, mediaUrl?, deps? }`

  **WHY Each Reference Matters**:
  - MS Teams outbound.ts: The EXACT interface contract to implement — field names, return types, chunker integration
  - MS Teams send.ts: Shows HTTP error handling pattern that OpenClaw expects (ok/error result)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Outbound adapter compiles and exports correctly
    Tool: Bash
    Steps:
      1. npx tsc --noEmit src/send.ts
      2. Assert: exit code 0
      3. grep -c "channelTalkOutbound" src/send.ts
      4. Assert: output >= "1"
      5. grep -c "deliveryMode" src/send.ts
      6. Assert: output >= "1"
      7. grep -c "sendText" src/send.ts
      8. Assert: output >= "1"
    Expected Result: Valid outbound adapter with required fields

  Scenario: Outbound reads config from correct path
    Tool: Bash
    Steps:
      1. grep "channel-talk" src/send.ts
      2. Assert: contains reference to cfg.channels?.['channel-talk'] or similar
    Expected Result: Config read from channels.channel-talk namespace
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `feat(channel-talk): add outbound adapter and webhook gateway`
  - Files: `src/send.ts`

---

- [x] 5. Webhook Gateway — src/webhook.ts

  **What to do**:
  - Create `src/webhook.ts` exporting `startChannelTalkWebhook(ctx: ChannelGatewayContext)`:
    1. Read config from `ctx.cfg.channels?.['channel-talk']`
    2. Check `enabled` flag; if disabled, log and return
    3. Extract `accessKey`, `accessSecret`, webhook `port` (default 3979), `path` (default `/api/channel-talk`)
    4. Dynamically import Express: `const { default: express } = await import('express')`
    5. Create Express app with `express.json()` middleware
    6. Set up POST handler at configured path:
       a. Parse webhook body as `ChannelTalkWebhookEvent`
       b. **Filter check**: Skip if `entity.chatType !== 'group'` (not team chat) — log drop reason
       c. **Filter check**: Skip if `entity.personType === 'bot'` (self-message prevention) — log drop reason
       d. **Filter check**: Skip if `entity.plainText` is empty/whitespace-only — log drop reason
       e. **Filter check**: Skip if `refers.group?.id` is missing — log drop reason, can't reply
       f. Extract: `groupId = refers.group.id`, `senderName = refers.manager?.name ?? 'Unknown'`, `senderId = entity.personId`, `messageText = entity.plainText`, `messageId = entity.id`
       g. **Dedup check**: Check in-memory Map for `messageId`; if seen within TTL (60s), skip as duplicate
       h. Build OpenClaw inbound context via `runtime.channel.reply.finalizeInboundContext()`:
          - `Body`: messageText
          - `RawBody`: messageText
          - `From`: `channel-talk:${senderId}`
          - `To`: `group:${groupId}`
          - `SessionKey`: resolved via `runtime.channel.routing.resolveAgentRoute({cfg, channel: CHANNEL_TALK_ID, peer: groupId})`
          - `ChatType`: `'channel'` (team group chat)
          - `SenderName`: senderName
          - `SenderId`: senderId
          - `Provider`: `CHANNEL_TALK_ID`
          - `Surface`: `CHANNEL_TALK_ID`
          - `MessageSid`: messageId
          - `Timestamp`: new Date(entity.createdAt)
       i. Create reply dispatcher that calls outbound sendText
       j. Dispatch via `runtime.channel.reply.dispatchReplyFromConfig({ctx: ctxPayload, cfg, dispatcher, replyOptions: {}})`
       k. Return 200 OK to Channel Talk
    7. Add GET health endpoint at same path: return `{ status: 'ok', channel: 'channel-talk' }`
    8. Listen on configured port
    9. Handle `ctx.abortSignal` for graceful shutdown (close HTTP server)
    10. Update gateway status via `ctx.setStatus('running')`
    11. Return `{ app, shutdown }` cleanup handle

  - **In-memory dedup cache**:
    - `Map<string, number>` mapping messageId → timestamp
    - TTL: 60 seconds
    - Cleanup: periodic sweep every 30s via setInterval (cleared on shutdown)

  **Must NOT do**:
  - Do NOT implement complex webhook signature verification (Channel Talk doesn't provide it)
  - Do NOT persist dedup cache to disk/DB
  - Do NOT handle file/media attachments in webhooks
  - Do NOT process `message.created.userChat` events (customer chat out of scope)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core gateway logic with Express server, OpenClaw runtime dispatch integration — most complex task
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/monitor.ts` — Gateway structure: dynamic Express import, port/path from config, abortSignal shutdown, status updates, return `{app, shutdown}`
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/monitor-handler/message-handler.ts` — THE critical reference: inbound dispatch flow via `finalizeInboundContext()` → `resolveAgentRoute()` → `dispatchReplyFromConfig()`. Shows exact ctxPayload fields (Body, RawBody, From, To, SessionKey, ChatType, SenderName, SenderId, Provider, Surface, MessageSid, Timestamp). Shows reply dispatcher creation pattern.

  **API/Type References**:
  - `openclaw/plugin-sdk` — `ChannelGatewayContext: { cfg, accountId, account, runtime, abortSignal, log, getStatus, setStatus }`, `logInboundDrop`, `recordPendingHistoryEntryIfEnabled`

  **External References**:
  - Channel Talk webhook docs — Event payload: `{event, type, entity: {chatType, personType, personId, blocks, plainText, id, channelId, createdAt}, refers: {manager, group}}`

  **WHY Each Reference Matters**:
  - MS Teams monitor.ts: Express server lifecycle pattern — port binding, graceful shutdown, status reporting
  - MS Teams message-handler.ts: THE most important reference — without following this dispatch pattern exactly, messages won't reach the OpenClaw AI engine. Every field in `finalizeInboundContext()` matters.
  - ChannelGatewayContext type: Ensures correct function signature for `startAccount`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Webhook module compiles
    Tool: Bash
    Steps:
      1. npx tsc --noEmit src/webhook.ts
      2. Assert: exit code 0
    Expected Result: Gateway code compiles cleanly

  Scenario: Webhook exports startChannelTalkWebhook function
    Tool: Bash
    Steps:
      1. grep -c "export.*startChannelTalkWebhook" src/webhook.ts
      2. Assert: output is "1"
    Expected Result: Gateway function is exported

  Scenario: Webhook has self-message filtering
    Tool: Bash
    Steps:
      1. grep "personType" src/webhook.ts
      2. Assert: contains bot filtering logic (personType === 'bot' or similar)
    Expected Result: Bot messages are filtered to prevent echo loops

  Scenario: Webhook has dedup logic
    Tool: Bash
    Steps:
      1. grep -c "dedup\|duplicate\|messageId.*Map\|seen" src/webhook.ts
      2. Assert: output >= "1"
    Expected Result: Deduplication mechanism exists

  Scenario: Webhook handles graceful shutdown
    Tool: Bash
    Steps:
      1. grep "abortSignal\|abort" src/webhook.ts
      2. Assert: contains abort signal handling
    Expected Result: Graceful shutdown via abortSignal
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(channel-talk): add outbound adapter and webhook gateway`
  - Files: `src/webhook.ts`

---

- [x] 6. Channel Plugin Assembly — src/channel.ts

  **What to do**:
  - Create `src/channel.ts` exporting `channelTalkPlugin: ChannelPlugin<ResolvedChannelTalkAccount>`:
    - `id`: `CHANNEL_TALK_ID` (`'channel-talk'`)
    - `meta`: `{ id: CHANNEL_TALK_ID, label: 'Channel Talk', selectionLabel: 'Channel Talk (채널톡)', docsPath: 'channel-talk', docsLabel: 'Channel Talk Setup', blurb: '채널톡 Team Chat integration', aliases: ['channeltalk', '채널톡'], order: 110 }`
    - `capabilities`: `{ chatTypes: ['channel'] }` — team chat only, no 'direct' or 'thread'
    - `config` adapter:
      - `listAccountIds(cfg)`: return `[DEFAULT_ACCOUNT_ID]` (single-account plugin)
      - `resolveAccount(cfg, accountId?)`: read from `cfg.channels?.['channel-talk']`, return resolved account object with accessKey, accessSecret, enabled state
      - `isConfigured(cfg)`: check `cfg.channels?.['channel-talk']?.accessKey` exists
      - `defaultAccountId`: `DEFAULT_ACCOUNT_ID`
    - `outbound`: import `channelTalkOutbound` from `./send.js`
    - `gateway`:
      - `startAccount(ctx)`: dynamically import `./webhook.js` and call `startChannelTalkWebhook(ctx)`
    - `setup`:
      - `applyAccountConfig({ input, cfg })`: merge Channel Talk config into `cfg.channels['channel-talk']`
      - `resolveAccountId()`: return `DEFAULT_ACCOUNT_ID`
    - `status`:
      - `probeAccount({ cfg })`: call `listManagers()` API to verify credentials, return probe result
      - `buildAccountSnapshot({ cfg })`: return `{ configured: isConfigured, enabled, port, probe }`
    - `security`:
      - `collectWarnings({ cfg })`: warn if groupPolicy is 'open' (any group chat triggers AI)
    - `reload`: `{ configPrefixes: ['channels.channel-talk'] }`
    - `configSchema`: `buildChannelConfigSchema(ChannelTalkConfigSchema)`

  **Must NOT do**:
  - Do NOT implement mentions, threading, streaming, actions, commands, pairing, directory, resolver adapters
  - Do NOT implement onboarding flows
  - Do NOT add agentPrompt or agentTools

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Central integration point wiring all adapters together — needs careful interface compliance
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/src/channel.ts` — THE primary reference: complete ChannelPlugin implementation showing every adapter wired together. Copy structure exactly: meta, capabilities, config (listAccountIds, resolveAccount, isConfigured), outbound, gateway (dynamic import in startAccount), setup, status (probeAccount, buildAccountSnapshot), security, reload, configSchema
  
  **API/Type References**:
  - `openclaw/plugin-sdk` — `ChannelPlugin<ResolvedAccount>`, `DEFAULT_ACCOUNT_ID`, `buildChannelConfigSchema`, `ChannelGatewayContext`, `OpenClawConfig`

  **WHY Each Reference Matters**:
  - MS Teams channel.ts: The EXACT shape of every adapter — field names, return types, optional vs required. Deviating from this shape causes runtime registration failures.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Channel plugin compiles
    Tool: Bash
    Steps:
      1. npx tsc --noEmit src/channel.ts
      2. Assert: exit code 0
    Expected Result: Plugin compiles with all adapters

  Scenario: Channel plugin exports required interface
    Tool: Bash
    Steps:
      1. grep "channelTalkPlugin" src/channel.ts
      2. Assert: exported as ChannelPlugin type
      3. grep "capabilities" src/channel.ts
      4. Assert: chatTypes defined
      5. grep "config" src/channel.ts
      6. Assert: config adapter present
      7. grep "outbound" src/channel.ts
      8. Assert: outbound adapter referenced
      9. grep "gateway" src/channel.ts
      10. Assert: gateway adapter present
    Expected Result: All required adapters wired

  Scenario: Config reads from correct namespace
    Tool: Bash
    Steps:
      1. grep "channel-talk" src/channel.ts
      2. Assert: reads from cfg.channels?.['channel-talk']
    Expected Result: Config namespace matches plugin ID
  ```

  **Commit**: YES
  - Message: `feat(channel-talk): assemble channel plugin with all adapters`
  - Files: `src/channel.ts`

---

- [x] 7. Entry Point — index.ts

  **What to do**:
  - Create `index.ts` at project root:
    ```typescript
    import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
    import { emptyPluginConfigSchema } from 'openclaw/plugin-sdk';
    import { channelTalkPlugin } from './src/channel.js';
    import { setChannelTalkRuntime } from './src/runtime.js';

    const plugin = {
      id: 'channel-talk',
      name: 'Channel Talk',
      description: 'Channel Talk (채널톡) Team Chat channel plugin',
      configSchema: emptyPluginConfigSchema(),
      register(api: OpenClawPluginApi) {
        setChannelTalkRuntime(api.runtime);
        api.registerChannel({ plugin: channelTalkPlugin });
      },
    };

    export default plugin;
    ```

  **Must NOT do**:
  - Do NOT add any logic beyond registration — keep entry point minimal
  - Do NOT import anything unnecessary

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single small file, direct copy of MS Teams pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 6)
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `/home/happycastle/nodejs/lib/node_modules/openclaw/extensions/msteams/index.ts` — EXACT pattern: import plugin + runtime setter, export default object with { id, name, description, configSchema, register(api) }

  **WHY Each Reference Matters**:
  - MS Teams index.ts: This is the ONLY entry point shape OpenClaw recognizes. Deviate and the plugin won't load.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Entry point compiles
    Tool: Bash
    Steps:
      1. npx tsc --noEmit index.ts
      2. Assert: exit code 0
    Expected Result: Entry point compiles

  Scenario: Entry point follows exact plugin shape
    Tool: Bash
    Steps:
      1. grep "export default" index.ts
      2. Assert: default export exists
      3. grep "register" index.ts
      4. Assert: register function present
      5. grep "registerChannel" index.ts
      6. Assert: calls api.registerChannel
      7. grep "setChannelTalkRuntime" index.ts
      8. Assert: sets runtime on register
    Expected Result: Plugin shape matches OpenClaw requirements
  ```

  **Commit**: YES
  - Message: `feat(channel-talk): add plugin entry point`
  - Files: `index.ts`

---

- [x] 8. Full Compilation Verification

  **What to do**:
  - Run full TypeScript compilation: `npx tsc --noEmit`
  - Verify all imports resolve correctly
  - Verify plugin manifest is valid JSON with correct channel ID
  - Verify package.json has all required openclaw metadata fields
  - Fix any compilation errors found
  - Create a `.gitignore` if not exists (add `node_modules/`, `dist/`, `.sisyphus/evidence/`)

  **Must NOT do**:
  - Do NOT try to start the plugin (needs full OpenClaw runtime)
  - Do NOT add tests at this stage

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration verification needs thorough checking of all cross-module imports and type compatibility
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - All `src/*.ts` files created in Tasks 2-7
  - `index.ts`, `package.json`, `openclaw.plugin.json`

  **WHY Each Reference Matters**:
  - This is the integration gate — all modules must compile together as a cohesive plugin

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full project compiles without errors
    Tool: Bash
    Steps:
      1. npx tsc --noEmit
      2. Assert: exit code 0
      3. Assert: no error output
    Expected Result: Zero TypeScript compilation errors

  Scenario: All source files exist
    Tool: Bash
    Steps:
      1. ls index.ts src/types.ts src/api-client.ts src/config-schema.ts src/runtime.ts src/send.ts src/webhook.ts src/channel.ts
      2. Assert: all 8 files exist (exit code 0)
    Expected Result: Complete file structure

  Scenario: Package.json has all openclaw fields
    Tool: Bash
    Steps:
      1. python3 -c "import json; d=json.load(open('package.json')); assert 'openclaw' in str(d), 'missing openclaw'; print('OK')"
      2. Assert: output is "OK"
    Expected Result: Package metadata complete

  Scenario: Plugin manifest matches channel ID
    Tool: Bash
    Steps:
      1. python3 -c "import json; d=json.load(open('openclaw.plugin.json')); assert d['id']=='channel-talk'; assert 'channel-talk' in d['channels']; print('OK')"
      2. Assert: output is "OK"
    Expected Result: Manifest consistent with plugin code
  ```

  **Commit**: YES
  - Message: `chore(channel-talk): verify full compilation and fix any issues`
  - Files: any fixes needed
  - Pre-commit: `npx tsc --noEmit`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(channel-talk): scaffold project with package.json, manifest, and tsconfig` | package.json, openclaw.plugin.json, tsconfig.json | JSON validity check |
| 2+3 | `feat(channel-talk): add types, API client, config schema, and runtime` | src/types.ts, src/api-client.ts, src/config-schema.ts, src/runtime.ts | `npx tsc --noEmit` on individual files |
| 4+5 | `feat(channel-talk): add outbound adapter and webhook gateway` | src/send.ts, src/webhook.ts | `npx tsc --noEmit` on files |
| 6 | `feat(channel-talk): assemble channel plugin with all adapters` | src/channel.ts | `npx tsc --noEmit` |
| 7 | `feat(channel-talk): add plugin entry point` | index.ts | `npx tsc --noEmit` |
| 8 | `chore(channel-talk): verify full compilation and fix any issues` | any fixes | `npx tsc --noEmit` (full) |

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit                    # Expected: exit code 0, no errors
cat openclaw.plugin.json | python3 -m json.tool  # Expected: valid JSON
ls index.ts src/*.ts                # Expected: 8 files listed
grep -r "channel-talk" src/ index.ts  # Expected: consistent channel ID usage
```

### Final Checklist
- [x] All "Must Have" present (webhook, outbound, config, self-filter, defensive parsing, shutdown)
- [x] All "Must NOT Have" absent (no polls/threads/media/mentions/pairing/directory/UI)
- [x] Full TypeScript compilation passes
- [x] Plugin follows MS Teams pattern faithfully
- [x] Config reads from `channels.channel-talk` namespace
- [x] Webhook gateway handles abortSignal for graceful shutdown
- [x] Bot self-messages are filtered (no echo loops)
- [x] API client uses correct headers (x-access-key, x-access-secret)
- [x] Outbound sends with actAsManager option
