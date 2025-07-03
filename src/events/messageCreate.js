import Utils from "../utils/utils.js";
import Config from "../config.js";
import Discord from "discord.js";
const { ButtonStyle, PermissionsBitField } = Discord;

export default (Bot) => {
  Bot.on("messageCreate", async (message) => {
    if (
      !message.content.toLowerCase().startsWith(Config.PREFIX) ||
      !message.guild
    )
      return;

    const [command, ...args] = message.content
      .slice(Config.PREFIX.length)
      .trim()
      .split(/\s+/);

    if (command !== "ticket") return;

    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply({
        content: "You are not permissions to use this command.",
      });
    }

    await message.delete().catch(() => undefined);

    const ticketChannel = message.guild.channels.cache.get(
      Config.TICKET.CHANNEL
    );
    if (!ticketChannel) {
      return message.reply({
        content: "Please write ticket channel ID in config file.",
      });
    }

    await ticketChannel.send({
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

    const reply = await message.channel.send(
      `Sended the message to ${ticketChannel}`
    );
    setTimeout(() => reply.delete().catch(() => undefined), 1000);
  });
};
