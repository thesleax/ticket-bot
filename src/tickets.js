import {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  EmbedBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
} from "discord.js";
import config from "./config.js";

const { ViewChannel, SendMessages, ReadMessageHistory, AttachFiles } = PermissionFlagsBits;
const MEMBER_PERMS = [ViewChannel, SendMessages, ReadMessageHistory, AttachFiles];
const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

// Users whose ticket is being created right now: stops a double click from opening two channels.
const opening = new Set();

// Discord caps an embed description at 4096 characters (5 long answers can pass that).
const embed = (description) =>
  new EmbedBuilder().setColor(config.COLOR).setDescription(description.slice(0, 4096)).setTimestamp();

// Same ids as before 1.0.0, so panels and tickets posted by older versions keep working.
export const IDS = { OPEN: "ticket", FORM: "ticket", APPROVE: "successTicket", ARCHIVE: "archiveTicket", DELETE: "deleteTicket" };

const button = (id, { LABEL, EMOJI, STYLE }) =>
  new ButtonBuilder().setCustomId(id).setLabel(LABEL).setStyle(STYLE).setEmoji(EMOJI);

const { APPROVE, ARCHIVE, DELETE } = config.TICKET_BUTTONS;
const ticketButtons = ({ approved = false } = {}) =>
  new ActionRowBuilder().addComponents(
    button(IDS.APPROVE, APPROVE).setDisabled(approved),
    button(IDS.ARCHIVE, ARCHIVE),
    button(IDS.DELETE, DELETE),
  );

export const isStaff = (member) =>
  member.id === member.guild.ownerId || config.STAFF_ROLE_IDS.some((id) => member.roles.cache.has(id));

// Ticket channels are named ticket-<user id>, and archive-<user id> once archived.
const ownerOf = (channel) => channel.name.match(/^(?:ticket|archive)-(\d+)$/)?.[1] ?? "";

const openTicketOf = (guild, userId) =>
  guild.channels.cache.find((c) => c.parentId === config.CATEGORY_ID && c.name === `ticket-${userId}`);

export function panel() {
  const { TITLE, DESCRIPTION, BUTTON } = config.PANEL;
  return {
    embeds: [embed(DESCRIPTION).setTitle(TITLE || null).setTimestamp(null)],
    components: [new ActionRowBuilder().addComponents(button(IDS.OPEN, BUTTON))],
  };
}

function form() {
  return new ModalBuilder()
    .setCustomId(IDS.FORM)
    .setTitle("Open a ticket")
    .addLabelComponents(
      config.QUESTIONS.map((q) =>
        new LabelBuilder()
          .setLabel(q.LABEL)
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId(q.ID)
              .setStyle(q.STYLE)
              .setMinLength(q.MIN_LENGTH ?? 0)
              .setMaxLength(q.MAX_LENGTH ?? 1000)
              .setPlaceholder(q.PLACE_HOLDER ?? "")
              .setRequired(q.REQUIRED ?? true),
          ),
      ),
    );
}

// "Open ticket" button: show the form, or open the ticket straight away when SHOW_MODAL is off.
export async function onOpenButton(interaction) {
  const existing = openTicketOf(interaction.guild, interaction.user.id);
  if (existing) return interaction.reply(ephemeral(`You already have an open ticket: ${existing}`));
  if (config.SHOW_MODAL && config.QUESTIONS.length) return interaction.showModal(form());
  return openTicket(interaction, []);
}

export function onForm(interaction) {
  const answers = config.QUESTIONS.map((q) => ({
    question: q.LABEL,
    answer: interaction.fields.getTextInputValue(q.ID).trim(),
  })).filter((a) => a.answer);
  return openTicket(interaction, answers);
}

async function openTicket(interaction, answers) {
  const { guild, user } = interaction;
  if (opening.has(user.id)) return interaction.reply(ephemeral("Your ticket is already being created."));
  opening.add(user.id);
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const existing = openTicketOf(guild, user.id);
    if (existing) return await interaction.editReply(`You already have an open ticket: ${existing}`);

    const channel = await guild.channels.create({
      name: `ticket-${user.id}`,
      type: ChannelType.GuildText,
      parent: config.CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [ViewChannel] },
        { id: interaction.client.user.id, allow: [...MEMBER_PERMS, PermissionFlagsBits.ManageChannels] },
        config.LOCK_UNTIL_CONFIRMED
          ? { id: user.id, allow: [ViewChannel, ReadMessageHistory], deny: [SendMessages, AttachFiles] }
          : { id: user.id, allow: MEMBER_PERMS },
        ...config.STAFF_ROLE_IDS.map((id) => ({ id, allow: MEMBER_PERMS })),
      ],
    });

    const lines = [`**Opened by** ${user} (\`${user.id}\`)`];
    for (const { question, answer } of answers) lines.push(`\n**${question}**\n${answer}`);
    const roles = config.STAFF_ROLE_IDS.map((id) => `<@&${id}>`).join(" ");

    await channel.send({
      content: roles || undefined,
      embeds: [embed(lines.join("\n")).setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })],
      components: [ticketButtons()],
      allowedMentions: { roles: config.STAFF_ROLE_IDS },
    });
    await interaction.editReply(`Your ticket is open: ${channel}`);
  } finally {
    opening.delete(user.id);
  }
}

export async function onApprove(interaction) {
  if (!isStaff(interaction.member)) return interaction.reply(ephemeral("Only staff can approve tickets."));
  await interaction.update({ components: [ticketButtons({ approved: true })] });
  const owner = ownerOf(interaction.channel);
  if (!owner) return;
  // Unlocks LOCK_UNTIL_CONFIRMED tickets, and form tickets opened by versions before 1.0.0.
  await interaction.channel.permissionOverwrites.edit(owner, { SendMessages: true, AttachFiles: true });
  await interaction.channel.send({
    content: `<@${owner}>, your ticket was approved by ${interaction.user}.`,
    allowedMentions: { users: [owner] },
  });
}

export async function onArchive(interaction) {
  const { channel } = interaction;
  if (!isStaff(interaction.member)) return interaction.reply(ephemeral("Only staff can archive tickets."));
  if (channel.parentId === config.ARCHIVE_CATEGORY_ID) return interaction.reply(ephemeral("This ticket is already archived."));

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const owner = ownerOf(channel);
  await channel.setParent(config.ARCHIVE_CATEGORY_ID, { lockPermissions: false });
  if (owner) await channel.permissionOverwrites.delete(owner);
  await channel.setName(channel.name.replace(/^ticket-/, "archive-"));
  await interaction.message.edit({
    components: [new ActionRowBuilder().addComponents(button(IDS.DELETE, DELETE))],
  });
  await interaction.editReply("Ticket archived.");
}

export async function onDelete(interaction) {
  const { channel, member } = interaction;
  const approved = interaction.message.components[0]?.components.some(
    (c) => c.customId === IDS.APPROVE && c.disabled,
  );
  const ownerMayDelete = member.id === ownerOf(channel) && !approved;
  if (!isStaff(member) && !ownerMayDelete) {
    return interaction.reply(
      ephemeral(approved ? "This ticket was approved by staff, so only staff can delete it." : "Only staff can delete this ticket."),
    );
  }
  await interaction.update({ components: [] });
  await channel.send({ embeds: [embed(`Deleted by ${interaction.user}. This channel closes in 5 seconds.`)] });
  setTimeout(() => channel.delete().catch(() => {}), 5_000);
}
