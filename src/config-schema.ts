/**
 * Channel Talk Plugin Configuration Schema
 * Defines the structure and validation for Channel Talk plugin configuration
 */

import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

/**
 * Channel Talk configuration schema using TypeBox
 * Defines required and optional configuration fields for the plugin
 */
export const ChannelTalkConfigSchema = Type.Object(
  {
    /** Enable/disable the Channel Talk plugin */
    enabled: Type.Optional(Type.Boolean({ default: true })),
    
    /** Channel Talk API access key (required when enabled) */
    accessKey: Type.String({
      description: 'Channel Talk access key for API authentication',
    }),
    
    /** Channel Talk API access secret (required when enabled) */
    accessSecret: Type.String({
      description: 'Channel Talk access secret for API authentication',
    }),
    
    /** Webhook configuration */
    webhook: Type.Optional(
      Type.Object({
        /** Port for webhook server (default: 3979) */
        port: Type.Optional(Type.Number({ default: 3979 })),
        
        /** Path for webhook endpoint (default: /api/channel-talk) */
        path: Type.Optional(Type.String({ default: '/api/channel-talk' })),
      })
    ),
    
    /** Bot display name for sent messages (optional) */
    botName: Type.Optional(
      Type.String({
        description: 'Bot display name for sent messages',
      })
    ),
    
    /** Group chat policy: 'open' = all groups allowed, 'closed' = none allowed */
    groupPolicy: Type.Optional(
      Type.Union([Type.Literal('open'), Type.Literal('closed')], { default: 'open' })
    ),

    /** Allowlist of group IDs (chatIds) to respond to. If set, only these groups get responses. */
    allowedGroups: Type.Optional(
      Type.Array(Type.String(), {
        description: 'List of group chatIds to respond to. If empty or omitted, all groups are allowed (subject to groupPolicy).',
      })
    ),

    /** If true, only respond when the bot is mentioned (@botName) in the message. Default: false */
    mentionOnly: Type.Optional(
      Type.Boolean({
        default: false,
        description: 'Only respond when the bot is mentioned in the message. Similar to Discord mention-only mode.',
      })
    ),
  },
  {
    additionalProperties: false,
  }
);

/**
 * TypeScript type derived from the schema
 * Use this for type-safe configuration handling
 */
export type ChannelTalkConfig = Static<typeof ChannelTalkConfigSchema>;
