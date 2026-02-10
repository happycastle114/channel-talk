/**
 * Channel Talk API v5 HTTP Client
 * Handles authentication, retries, and message sending
 */

import type {
  ChannelTalkConfig,
  ChannelTalkCredentials,
  SendMessageParams,
  SendMessageResponse,
} from './types.js';

/**
 * Sleep for specified milliseconds
 * Used for exponential backoff retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an API client for Channel Talk
 * Returns a client object with sendMessage method
 *
 * @param credentials - API credentials (accessKey, accessSecret)
 * @param baseUrl - Optional base URL override (default: https://api.channel.io)
 * @returns API client object with sendMessage method
 */
export function createApiClient(
  credentials: ChannelTalkCredentials,
  baseUrl: string = 'https://api.channel.io'
) {
  return {
    /**
     * Send a message to a Channel Talk group
     * Implements retry logic with exponential backoff for 429/5xx errors
     *
     * @param params - Message parameters (groupId, plainText, blocks, options, botName)
     * @returns Promise resolving to SendMessageResponse with messageId and groupId
     * @throws Error on authentication failure (401/403) or after max retries exhausted
     */
    async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
      const { groupId, plainText, blocks, options, botName } = params;

      // Build request body
      const body: Record<string, unknown> = {
        plainText,
      };

      if (blocks && blocks.length > 0) {
        body.blocks = blocks;
      }

      if (options && options.length > 0) {
        body.options = options;
      }

      // Build URL with optional botName query parameter
      const url = new URL(`/open/v5/groups/${groupId}/messages`, baseUrl);
      if (botName) {
        url.searchParams.set('botName', botName);
      }

      // Retry configuration: 2 retries with exponential backoff (1s, 3s)
      const maxRetries = 2;
      const retryDelays = [1000, 3000]; // milliseconds

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-access-key': credentials.accessKey,
              'x-access-secret': credentials.accessSecret,
            },
            body: JSON.stringify(body),
          });

          // Handle authentication errors (no retry)
          if (response.status === 401 || response.status === 403) {
            const errorText = await response.text();
            throw new Error(
              `Authentication failed (${response.status}): ${errorText}`
            );
          }

          // Handle success
          if (response.ok) {
            const data = (await response.json()) as Record<string, unknown>;

            // Extract messageId from response
            // Response structure: { message: { id: "...", ... }, ... }
            const messageId: string =
              (String((data.message as Record<string, unknown>)?.id) || '') ||
              (String(data.id) || '') ||
              '';

            return {
              messageId,
              groupId,
              message: data.message as Record<string, unknown>,
            };
          }

          // Handle retryable errors (429, 5xx)
          if (response.status === 429 || response.status >= 500) {
            const errorText = await response.text();
            lastError = new Error(
              `API error (${response.status}): ${errorText}`
            );

            // If this is the last attempt, throw
            if (attempt === maxRetries) {
              throw lastError;
            }

            // Wait before retry
            const delayMs = retryDelays[attempt];
            await sleep(delayMs);
            continue;
          }

          // Handle other 4xx errors (no retry)
          const errorText = await response.text();
          throw new Error(
            `API error (${response.status}): ${errorText}`
          );
        } catch (error) {
          // Network errors or other exceptions
          if (error instanceof Error) {
            lastError = error;
          } else {
            lastError = new Error(String(error));
          }

          // If this is the last attempt, throw
          if (attempt === maxRetries) {
            throw lastError;
          }

          // Wait before retry
          const delayMs = retryDelays[attempt];
          await sleep(delayMs);
        }
      }

      // Should not reach here, but throw last error if we do
      throw lastError || new Error('Unknown error sending message');
    },
  };
}

/**
 * Convenience function to send a message directly
 * Creates a client and sends a message in one call
 *
 * @param credentials - API credentials
 * @param params - Message parameters
 * @param baseUrl - Optional base URL override
 * @returns Promise resolving to SendMessageResponse
 */
export async function sendMessage(
  credentials: ChannelTalkCredentials,
  params: SendMessageParams,
  baseUrl?: string
): Promise<SendMessageResponse> {
  const client = createApiClient(credentials, baseUrl);
  return client.sendMessage(params);
}
