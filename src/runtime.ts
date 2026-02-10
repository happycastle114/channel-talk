/**
 * Channel Talk Plugin Runtime Singleton
 * Manages the plugin runtime instance for access throughout the plugin
 */

import type { PluginRuntime } from 'openclaw/plugin-sdk';

/** Module-level runtime instance */
let runtime: PluginRuntime | undefined;

/**
 * Set the Channel Talk plugin runtime
 * Called during plugin initialization to store the runtime reference
 *
 * @param next - The PluginRuntime instance from OpenClaw
 */
export function setChannelTalkRuntime(next: PluginRuntime): void {
  runtime = next;
}

/**
 * Get the Channel Talk plugin runtime
 * Throws if runtime has not been initialized
 *
 * @returns The PluginRuntime instance
 * @throws Error if runtime is not initialized
 */
export function getChannelTalkRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error('Channel Talk runtime not initialized');
  }
  return runtime;
}
