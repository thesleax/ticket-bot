import Utils from "../utils/utils.js";
import Config from "../config.js";
import Discord from "discord.js";
const { ButtonStyle } = Discord;

export default (Bot) => {
  Bot.on("messageCreate", (message) => {
    const Prefix = message.content.toLowerCase().startsWith(Config.PREFIX);

    if (!Prefix) return;

    const Args = message.content.split(" ").slice(1);
    const Command = message.content.split(" ")[0].slice(Config.PREFIX.length);

    if (Command === "ticket") {
      if (message.author.id !== message.guild.ownerId) return;

      const TicketChannel = message.guild.channels.cache.get(
        Config.TICKET.CHANNEL
      );

      message.delete().catch(() => {
        return undefined;
      });

      if (TicketChannel) {
        TicketChannel.send({
          embeds: [Utils.embed(Config.TICKET.MESSAGE, message.guild, Bot, "")],
          components: [
            Utils.button(
              ButtonStyle.Primary,
              "Open Ticket!",
              "🎫",
              "ticket",
              false
            ),
          ],
        });
      }
    }
  });
};
