/**
 * Channel Talk API v5 TypeScript Type Definitions
 * Interfaces for webhook events, API requests/responses, and configuration
 */

/**
 * Channel Talk API credentials for authentication
 * Uses x-access-key and x-access-secret headers
 */
export interface ChannelTalkCredentials {
  /** Access key for API authentication */
  accessKey: string;
  /** Access secret for API authentication */
  accessSecret: string;
}

/**
 * Channel Talk plugin configuration
 * Contains credentials and optional base URL override
 */
export interface ChannelTalkConfig {
  /** API credentials */
  credentials: ChannelTalkCredentials;
  /** Base URL for API calls (default: https://api.channel.io) */
  baseUrl?: string;
}

/**
 * Text block in a message
 * Supports HTML formatting: <b>, <i>, <link>, etc.
 */
export interface TextBlock {
  type: 'text';
  /** HTML-formatted text content */
  value: string;
}

/**
 * Code block in a message
 */
export interface CodeBlock {
  type: 'code';
  /** Code content */
  value: string;
}

/**
 * Bulleted list block in a message
 */
export interface BulletsBlock {
  type: 'bullets';
  /** Array of text blocks for each bullet point */
  blocks: TextBlock[];
}

/**
 * Union type for all message block types
 */
export type MessageBlock = TextBlock | CodeBlock | BulletsBlock;

/**
 * Message options that control behavior
 */
export type MessageOption =
  | 'actAsManager'
  | 'displayAsChannel'
  | 'doNotPost'
  | 'doNotSearch'
  | 'doNotSendApp'
  | 'doNotUpdateDesk'
  | 'immutable'
  | 'private'
  | 'silent';

/**
 * Parameters for sending a message to Channel Talk
 */
export interface SendMessageParams {
  /** Group ID (team chat identifier) */
  groupId: string;
  /** Plain text content of the message */
  plainText: string;
  /** Message blocks (optional, for rich formatting) */
  blocks?: MessageBlock[];
  /** Message options (optional) */
  options?: MessageOption[];
  /** Bot name to display as sender (optional) */
  botName?: string;
  /** Root message ID for thread replies (optional) */
  rootMessageId?: string;
}

/**
 * Response from sending a message
 */
export interface SendMessageResponse {
  /** Message ID returned by API */
  messageId: string;
  /** Group ID where message was sent */
  groupId: string;
  /** Full message object from API response */
  message?: Record<string, unknown>;
}

/**
 * Manager entity in webhook event
 */
export interface ChannelTalkManager {
  /** Manager ID */
  id: string;
  /** Manager name */
  name?: string;
}

/**
 * Group (team chat) entity in webhook event
 */
export interface ChannelTalkGroup {
  /** Group ID */
  id: string;
  /** Group name */
  name?: string;
}

/**
 * References to related entities in webhook event
 */
export interface ChannelTalkRefers {
  /** Manager who sent/received the message */
  manager?: ChannelTalkManager;
  /** Group (team chat) where message occurred */
  group?: ChannelTalkGroup;
}

/**
 * Entity data in webhook event
 * Contains the actual message content and metadata
 */
export interface ChannelTalkEntity {
  /** Message ID */
  id: string;
  /** Chat type: 'group' for team chat, 'user' for direct, 'customer' for customer chat */
  chatType: 'group' | 'user' | 'customer';
  /** Person type: 'manager' for staff, 'bot' for automated messages, 'customer' for customers */
  personType: 'manager' | 'bot' | 'customer';
  /** Message blocks (rich formatting) */
  blocks?: MessageBlock[];
  /** Plain text representation of message */
  plainText?: string;
  /** Chat ID */
  chatId?: string;
  /** Person ID (sender) */
  personId?: string;
  /** Created timestamp */
  createdAt?: number;
  /** Whether this is a thread message */
  threadMsg?: boolean;
  /** Thread key identifier */
  threadKey?: string;
  /** Root message ID (for thread replies) */
  rootMessageId?: string;
  /** Whether this is a thread root message */
  threadRoot?: boolean;
}

/**
 * Webhook event from Channel Talk
 * Sent when messages are created or other events occur
 */
export interface ChannelTalkWebhookEvent {
  /** Event action (e.g., 'push') */
  event: string;
  /** Event type identifier (e.g., 'message.created.teamChat') — may be absent for push events */
  type?: string;
  /** Entity data (message content, metadata) */
  entity: ChannelTalkEntity;
  /** References to related entities (manager, group) */
  refers: ChannelTalkRefers;
}
