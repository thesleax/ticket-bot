import Fs from "fs";
import Discord from "discord.js";
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ModalBuilder,
  Colors,
} = Discord;
import Config from "../config.js";
import { PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js";

class Utils {
  static login(Bot) {
    Bot.login(Config.TOKEN ? Config.TOKEN : process.env.TOKEN)
      .then(() => console.log("[BOT] Ticket bot active."))
      .catch((err) => console.log("" + err));
  }

  static event(Bot) {
    Fs.readdirSync("./src/events").forEach(async (file) => {
      const Event = await import(`../events/${file}`).then((x) => x);

      Event.default(Bot);
    });
  }

  static embed(Content, Guild, Bot, User) {
    const Embed = new EmbedBuilder()
      .setAuthor({
        name: `${Guild.name} Ticket System`,
        iconURL: Guild.iconURL({ dynamic: true }),
      })
      .setDescription(Content)
      .setColor(Colors.DarkNavy)
      .setFooter({
        text: Bot.user.username,
        iconURL: Bot.user.avatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setThumbnail(
        User
          ? User.avatarURL({ dynamic: true })
          : Guild.iconURL({ dynamic: true })
      );

    return Embed;
  }

  static button(Style, Label, Emoji, Id, Disabled) {
    const Row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(Id)
        .setLabel(Label)
        .setStyle(Style)
        .setEmoji(Emoji)
        .setDisabled(Disabled)
    );

    return Row;
  }

  static ticketButton() {
    let Buttons = [];

    Config.TICKET.BUTTONS.map((x) => {
      const Button = new ButtonBuilder()
        .setCustomId(x.ID)
        .setLabel(x.LABEL)
        .setStyle(x.STYLE)
        .setEmoji(x.EMOTE)
        .setDisabled(x.DISABLED);

      Buttons.push(Button);
    });

    let Row = new ActionRowBuilder().addComponents(Buttons);

    return Row;
  }

  static modal() {
    let Inputs = [];

    Config.TICKET.QUESTIONS.map((v) => {
      const Input = new TextInputBuilder()
        .setCustomId(v.ID)
        .setLabel(v.LABEL)
        .setStyle(v.STYLE)
        .setMinLength(v.MIN_LENGTH)
        .setMaxLength(v.MAX_LENGTH)
        .setPlaceholder(v.PLACE_HOLDER)
        .setRequired(v.REQUIRED);

      Inputs.push(Input);
    });

    let Modals = new ModalBuilder()
      .setCustomId("ticket")
      .setTitle("Ticket Creation Request");

    let Row = [];
    Inputs.map((x) => Row.push(new ActionRowBuilder().addComponents([x])));
    Modals.addComponents(Row);

    return Modals;
  }

  static createTicketPermissions(userId, staffRoles) {
    let permissions = [
      {
        id: userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.SendMessages,
        ],
      },
      {
        id: Config.GUILD_ID,
        deny: [PermissionFlagsBits.ViewChannel],
      },
    ];

    staffRoles.forEach((roleId) => {
      permissions.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.SendMessages,
        ],
      });
    });

    return permissions;
  }

  static async createTicketChannel(
    interaction,
    content = "",
    hasModalResponse = false
  ) {
    const channelName = `ticket-${interaction.user.id}`;
    const existingChannel = interaction.guild.channels.cache.find(
      (x) => x.name === channelName
    );

    if (existingChannel) {
      await interaction.followUp({
        content: `You already have a ticket request.`,
        flags: MessageFlags.Ephemeral,
      });
      return null;
    }

    const permissions = this.createTicketPermissions(
      interaction.user.id,
      Config.TICKET.STAFF_ROLES
    );

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: Config.TICKET.CATEGORY,
      permissionOverwrites: permissions,
    });

    await interaction.followUp({
      content: "Hey! Your ticket request has been successfully created.",
      flags: MessageFlags.Ephemeral,
    });

    const staffMentions = Config.TICKET.STAFF_ROLES.map(
      (roleId) => `<@&${roleId}>`
    ).join(", ");
    const baseContent = `Ticket Creator Member Information: \n${interaction.user} (\`${interaction.user.id}\`)`;
    const finalContent = hasModalResponse
      ? `${baseContent}\n${content}`
      : baseContent;

    await channel.send({
      content: staffMentions,
      embeds: [
        this.embed(
          finalContent,
          interaction.guild,
          interaction.client,
          interaction.user
        ),
      ],
      components: [this.ticketButton()],
    });

    return channel;
  }

  static isStaffMember(member) {
    return (
      Config.TICKET.STAFF_ROLES.some((x) => member.roles.cache.has(x)) ||
      member.id === member.guild.ownerId
    );
  }
}

export default Utils;
