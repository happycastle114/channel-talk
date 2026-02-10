import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { channelTalkPlugin } from "./src/channel.js";
import { setChannelTalkRuntime } from "./src/runtime.js";

const plugin = {
  id: "channel-talk",
  name: "Channel Talk",
  description: "Channel Talk (채널톡) Team Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setChannelTalkRuntime(api.runtime);
    api.registerChannel({ plugin: channelTalkPlugin });
  },
};

export default plugin;
