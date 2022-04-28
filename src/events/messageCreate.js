import Utils from "../utils/utils.js";
import Config from "../config.js";

export default (Bot) => {
  Bot.on("messageCreate", (message) => {
    const Prefix = message.content.toLowerCase().startsWith(Config.PREFIX);

    if (!Prefix) return;

    const Args = message.content.split(" ").slice(1);
    const Command = message.content.split(" ")[0].slice(Config.PREFIX.length);

    if (Command === "ticket") {
      if (message.author.id !== message.guild.ownerId) return;

      message.delete();

      message.channel.send({
        embeds: [Utils.embed(Config.TICKET.MESSAGE, message.guild, Bot, "")],
        components: [
          Utils.button("PRIMARY", "Open Ticket!", "🎫", "ticket", false),
        ],
      });
    }
  });
};
