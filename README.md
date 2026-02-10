# OpenClaw Channel Talk Plugin

Channel Talk Team Chat channel plugin for OpenClaw.

## Scope

- Team Chat (`chatType=group`) webhook ingestion
- Outbound text replies to Channel Talk groups via v5 REST API
- Single-account plugin configuration under `channels.channel-talk`

## Configuration

Configure in OpenClaw config:

```yaml
channels:
  channel-talk:
    enabled: true
    accessKey: "<channel-talk-access-key>"
    accessSecret: "<channel-talk-access-secret>"
    botName: "OpenClaw"
    groupPolicy: "open" # open | closed
    webhook:
      port: 3979
      path: "/api/channel-talk"
```

## Registration

- Plugin entry: `index.ts`
- Channel plugin export: `src/channel.ts` (`channelTalkPlugin`)
- Manifest: `openclaw.plugin.json` with `id="channel-talk"`

## Webhook and Outbound Behavior

- Webhook endpoint accepts team chat message events and drops invalid/non-group/bot/empty/duplicate payloads.
- Duplicate detection uses in-memory message ID cache (60s TTL, 30s sweep).
- Replies are dispatched through OpenClaw runtime and sent with `actAsManager` option.
- API client retries on `429`/`5xx` with backoff (`1s`, `3s`).

## Notes

- This extension is intended to run inside the OpenClaw workspace/runtime.
- Do not run standalone integration in this isolated repository.
