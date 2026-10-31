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
// A locked member could still write through threads, since @everyone has these permissions by default.
const { CreatePublicThreads, CreatePrivateThreads, SendMessagesInThreads } = PermissionFlagsBits;
const LOCKED_PERMS = [SendMessages, AttachFiles, CreatePublicThreads, CreatePrivateThreads, SendMessagesInThreads];
const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

// Users whose ticket is being created right now: stops a double click from opening two channels.
const opening = new Set();

// Discord fits at most 50 channels in one category, so a full category can't take another ticket.
const CATEGORY_MAX = 50;
// Configs from before 1.1.0 have no LIMITS, so these defaults apply to them.
const { COOLDOWN_SECONDS = 60, MAX_OPEN_TICKETS = CATEGORY_MAX } = config.LIMITS ?? {};
const COOLDOWN_MS = COOLDOWN_SECONDS * 1000;
const MAX_TICKETS = Math.min(MAX_OPEN_TICKETS, CATEGORY_MAX);
// When each member last opened a ticket. Entries remove themselves when the cooldown ends.
const lastOpened = new Map();

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

const channelsIn = (guild, categoryId) => guild.channels.cache.filter((c) => c.parentId === categoryId).size;

// Why this member can't open a ticket right now, or undefined when they can.
// Checked before the channel exists, so many members clicking in the same second can pass
// MAX_OPEN_TICKETS by a few. Discord's 50 per category still stops them.
function cantOpen(member) {
  const existing = openTicketOf(member.guild, member.id);
  if (existing) return `You already have an open ticket: ${existing}`;
  if (channelsIn(member.guild, config.CATEGORY_ID) >= MAX_TICKETS) {
    return "All ticket slots are taken right now. Please try again a little later.";
  }
  const readyAt = (lastOpened.get(member.id) ?? 0) + COOLDOWN_MS;
  if (readyAt > Date.now() && !isStaff(member)) {
    return `You opened a ticket a moment ago. You can open another <t:${Math.ceil(readyAt / 1000)}:R>.`;
  }
}

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
  const reason = cantOpen(interaction.member);
  if (reason) return interaction.reply(ephemeral(reason));
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
    // Checked again: the form may have been open for a while.
    const reason = cantOpen(interaction.member);
    if (reason) return await interaction.editReply(reason);

    const channel = await guild.channels.create({
      name: `ticket-${user.id}`,
      type: ChannelType.GuildText,
      parent: config.CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [ViewChannel] },
        { id: interaction.client.user.id, allow: [...MEMBER_PERMS, PermissionFlagsBits.ManageChannels] },
        config.LOCK_UNTIL_CONFIRMED
          ? { id: user.id, allow: [ViewChannel, ReadMessageHistory], deny: LOCKED_PERMS }
          : { id: user.id, allow: MEMBER_PERMS },
        ...config.STAFF_ROLE_IDS.map((id) => ({ id, allow: MEMBER_PERMS })),
      ],
    });
    if (COOLDOWN_MS > 0) {
      lastOpened.set(user.id, Date.now());
      setTimeout(() => lastOpened.delete(user.id), COOLDOWN_MS).unref();
    }

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
  await interaction.channel.permissionOverwrites.edit(owner, {
    SendMessages: true,
    AttachFiles: true,
    CreatePublicThreads: null,
    CreatePrivateThreads: null,
    SendMessagesInThreads: null,
  });
  await interaction.channel.send({
    content: `<@${owner}>, your ticket was approved by ${interaction.user}.`,
    allowedMentions: { users: [owner] },
  });
}

export async function onArchive(interaction) {
  const { channel } = interaction;
  if (!isStaff(interaction.member)) return interaction.reply(ephemeral("Only staff can archive tickets."));
  if (channel.parentId === config.ARCHIVE_CATEGORY_ID) return interaction.reply(ephemeral("This ticket is already archived."));
  if (channelsIn(interaction.guild, config.ARCHIVE_CATEGORY_ID) >= CATEGORY_MAX) {
    return interaction.reply(ephemeral("The archive category is full (Discord allows 50 channels). Delete some archived tickets first."));
  }

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
