import Config from "../config.js";

export default (Bot) => {
  Bot.on("ready", () => {
    Bot.user.setActivity(Config.ACTIVITY.NAME, {
      type: Config.ACTIVITY.TYPE,
    });
  });
};
