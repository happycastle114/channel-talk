import type { ChannelPlugin, OpenClawConfig } from 'openclaw/plugin-sdk';
import { DEFAULT_ACCOUNT_ID } from 'openclaw/plugin-sdk';
import type { ChannelTalkCredentials } from './types.js';
import { ChannelTalkConfigSchema } from './config-schema.js';
import { channelTalkOutbound } from './send.js';
import { startChannelTalkWebhook } from './webhook.js';

export type ResolvedChannelTalkAccount = {
  accountId: string;
  credentials: ChannelTalkCredentials;
  config: {
    enabled?: boolean;
    accessKey?: string;
    accessSecret?: string;
    botName?: string;
    groupPolicy?: string;
    webhook?: { port?: number; path?: string };
  };
};

function readChannelConfig(cfg: OpenClawConfig): Record<string, unknown> | undefined {
  return (cfg.channels as Record<string, Record<string, unknown>> | undefined)?.['channel-talk'];
}

function resolveCredentials(
  raw: Record<string, unknown> | undefined,
): ChannelTalkCredentials | null {
  const accessKey = typeof raw?.accessKey === 'string' ? raw.accessKey : '';
  const accessSecret = typeof raw?.accessSecret === 'string' ? raw.accessSecret : '';
  if (!accessKey || !accessSecret) return null;
  return { accessKey, accessSecret };
}

const meta = {
  id: 'channel-talk',
  label: 'Channel Talk',
  selectionLabel: 'Channel Talk (채널톡)',
  docsPath: '/channels/channel-talk',
  docsLabel: 'Channel Talk Setup',
  blurb: '채널톡 Team Chat integration',
  aliases: ['channeltalk', '채널톡'],
  order: 500,
} as const;

export const channelTalkPlugin: ChannelPlugin<ResolvedChannelTalkAccount> = {
  id: 'openclaw-channel-talk',

  meta: { ...meta },

  capabilities: {
    chatTypes: ['channel'],
    polls: false,
    threads: false,
    media: false,
  },

  reload: { configPrefixes: ['channels.channel-talk'] },

  configSchema: ChannelTalkConfigSchema,

  config: {
    listAccountIds: () => [DEFAULT_ACCOUNT_ID],

    resolveAccount: (cfg) => {
      const raw = readChannelConfig(cfg);
      const creds = resolveCredentials(raw);
      return {
        accountId: DEFAULT_ACCOUNT_ID,
        credentials: creds ?? { accessKey: '', accessSecret: '' },
        config: {
          enabled: raw?.enabled !== false,
          accessKey: typeof raw?.accessKey === 'string' ? raw.accessKey : undefined,
          accessSecret: typeof raw?.accessSecret === 'string' ? raw.accessSecret : undefined,
          botName: typeof raw?.botName === 'string' ? raw.botName : undefined,
          groupPolicy: typeof raw?.groupPolicy === 'string' ? raw.groupPolicy : undefined,
          webhook: raw?.webhook as { port?: number; path?: string } | undefined,
        },
      };
    },

    isConfigured: (account) =>
      Boolean(account.credentials.accessKey && account.credentials.accessSecret),

    resolveAllowFrom: () => undefined,
  },

  outbound: channelTalkOutbound,

  gateway: {
    startAccount: async (ctx) => {
      const port =
        (readChannelConfig(ctx.cfg)?.webhook as { port?: number } | undefined)?.port ?? 3979;
      ctx.setStatus({ accountId: ctx.accountId, port } as any);
      ctx.log?.info(`starting channel-talk webhook (port ${port})`);
      return startChannelTalkWebhook({
        cfg: ctx.cfg,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        accountId: ctx.accountId,
        setStatus: (next) => ctx.setStatus(next as any),
        log: ctx.log,
      });
    },
  },

  setup: {
    resolveAccountId: () => DEFAULT_ACCOUNT_ID,

    applyAccountConfig: ({ cfg, input }) => ({
      ...cfg,
      channels: {
        ...(cfg.channels as Record<string, unknown>),
        'channel-talk': {
          ...readChannelConfig(cfg),
          ...(input.token ? { accessKey: input.token } : {}),
          ...(input.botToken ? { accessSecret: input.botToken } : {}),
          enabled: true,
        },
      },
    } as OpenClawConfig),
  },

  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },

    buildChannelSummary: ({ snapshot }) => ({
      configured: snapshot.configured ?? false,
      running: snapshot.running ?? false,
      lastStartAt: snapshot.lastStartAt ?? null,
      lastStopAt: snapshot.lastStopAt ?? null,
      lastError: snapshot.lastError ?? null,
      port: snapshot.port ?? null,
    }),

    probeAccount: async ({ account }) => ({
      configured: Boolean(
        account.credentials.accessKey && account.credentials.accessSecret,
      ),
      enabled: account.config.enabled !== false,
    }),

    buildAccountSnapshot: ({ account, runtime }) => ({
      accountId: account.accountId,
      configured: Boolean(
        account.credentials.accessKey && account.credentials.accessSecret,
      ),
      enabled: account.config.enabled !== false,
      running: runtime?.running ?? false,
      lastStartAt: runtime?.lastStartAt ?? null,
      lastStopAt: runtime?.lastStopAt ?? null,
      lastError: runtime?.lastError ?? null,
    }),
  },

  security: {
    collectWarnings: ({ cfg }) => {
      const raw = readChannelConfig(cfg);
      const defaultGroupPolicy = (
        cfg.channels as Record<string, Record<string, unknown>> | undefined
      )?.defaults?.groupPolicy as string | undefined;
      const groupPolicy =
        (typeof raw?.groupPolicy === 'string' ? raw.groupPolicy : undefined) ??
        defaultGroupPolicy ??
        'open';

      if (groupPolicy !== 'open') {
        return [];
      }
      return [
        `- Channel Talk: groupPolicy="open" processes all team chat messages. ` +
          `Set channels.channel-talk.groupPolicy="closed" to disable team chat processing.`,
      ];
    },
  },
};
