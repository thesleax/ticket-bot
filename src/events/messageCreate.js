import Utils from "../utils/utils.js";
import Config from "../config.js";
import Discord from "discord.js";
const { ButtonStyle } = Discord;

export default (Bot) => {
  Bot.on("messageCreate", (message) => {
    const Prefix = message.content.toLowerCase().startsWith(Config.PREFIX);

    if (!Prefix && !message.guild) return;

    const Args = message.content.split(" ").slice(1);
    const Command = message.content.split(" ")[0].slice(Config.PREFIX.length);

    if (Command === "ticket") {
      if (!message.member.permissions.has("0x0000000000000008"))
        return message.reply({
          content: "You are not permissions to use this command.",
        });

      message.delete().catch(() => {
        return undefined;
      });

      let TicketChannel = message.guild.channels.cache.get(
        Config.TICKET.CHANNEL
      );

      if (!TicketChannel)
        return message.reply({
          content: "Please write ticket channel ID in config file.",
        });

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

      return message.channel.send(`Sended the message to ${TicketChannel}`);
    }
  });
};
