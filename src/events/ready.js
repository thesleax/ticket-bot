import { ActivityType } from "discord.js";
import Config from "../config.js";

export default (Bot) => {
  Bot.on("ready", () => {
    Bot.user.setPresence({
      status: Config.PRESENCE.STATUS || "online",
      activities: [
        {
          name: Config.PRESENCE.NAME,
          type: ActivityType[Config.PRESENCE.TYPE],
        },
      ],
    });
  });
};
