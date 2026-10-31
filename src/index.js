import {
  ActivityType,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  SlashCommandBuilder,
} from "discord.js";
import config from "./config.js";
import * as tickets from "./tickets.js";

const missing = ["GUILD_ID", "CATEGORY_ID", "ARCHIVE_CATEGORY_ID"].filter((key) => !config[key]);
if (!process.env.TOKEN) missing.unshift("TOKEN (in .env)");
if (missing.length) {
  console.error(`Fill in before starting: ${missing.join(", ")}. See README.md.`);
  process.exit(1);
}
const problems = tickets.configProblems();
if (!(config.PRESENCE.TYPE in ActivityType)) problems.push(`PRESENCE.TYPE "${config.PRESENCE.TYPE}" is not one of the listed types.`);
if (problems.length) {
  console.error(`Fix in src/config.js:\n- ${problems.join("\n- ")}\nSee README.md.`);
  process.exit(1);
}

const { ViewChannel, SendMessages, EmbedLinks, AttachFiles, ReadMessageHistory, ManageChannels, ManageRoles } = PermissionFlagsBits;
// What the bot needs in the ticket categories: it can only give members permissions it has itself.
const CATEGORY_PERMS = [ViewChannel, SendMessages, EmbedLinks, AttachFiles, ReadMessageHistory, ManageChannels, ManageRoles];
const PANEL_PERMS = [ViewChannel, SendMessages, EmbedLinks];

const panelCommand = new SlashCommandBuilder()
  .setName("ticket-panel")
  .setDescription("Post the ticket panel in this channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const { IDS } = tickets;
const buttons = {
  [IDS.OPEN]: tickets.onOpenButton,
  [IDS.APPROVE]: tickets.onApprove,
  [IDS.ARCHIVE]: tickets.onArchive,
  [IDS.DELETE]: tickets.onDelete,
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  presence: {
    status: config.PRESENCE.STATUS,
    activities: config.PRESENCE.NAME ? [{ name: config.PRESENCE.NAME, type: ActivityType[config.PRESENCE.TYPE] }] : [],
  },
});

client.once(Events.ClientReady, async (c) => {
  const guild = await c.guilds.fetch(config.GUILD_ID).catch(() => null);
  if (!guild) return stop(`GUILD_ID ${config.GUILD_ID} is not a server the bot is in.`);
  const channels = await guild.channels.fetch();
  for (const key of ["CATEGORY_ID", "ARCHIVE_CATEGORY_ID"]) {
    if (channels.get(config[key])?.type !== ChannelType.GuildCategory) return stop(`${key} is not a category in ${guild.name}.`);
  }
  const roles = await guild.roles.fetch();
  const badRoles = config.STAFF_ROLE_IDS.filter((id) => !roles.has(id));
  if (badRoles.length) return stop(`STAFF_ROLE_IDS not found in ${guild.name}: ${badRoles.join(", ")}`);
  if (config.STAFF_ROLE_IDS.includes(guild.id)) return stop("STAFF_ROLE_IDS contains @everyone, which would make every member staff.");

  for (const key of ["CATEGORY_ID", "ARCHIVE_CATEGORY_ID"]) {
    const lacking = channels.get(config[key]).permissionsFor(guild.members.me).missing(CATEGORY_PERMS);
    if (lacking.length) console.warn(`Warning: the bot is missing ${lacking.join(", ")} in ${key}, so tickets will fail there. See README.md.`);
  }

  await guild.commands.set([panelCommand]);
  console.log(`Logged in as ${c.user.tag}, /ticket-panel is ready in ${guild.name}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.inCachedGuild()) return;
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "ticket-panel") {
      const lacking = interaction.channel.permissionsFor(interaction.guild.members.me).missing(PANEL_PERMS);
      if (lacking.length) {
        return await interaction.reply({ content: `I need ${lacking.join(", ")} in this channel to post the panel.`, flags: MessageFlags.Ephemeral });
      }
      await interaction.channel.send(tickets.panel());
      await interaction.reply({ content: "Ticket panel posted.", flags: MessageFlags.Ephemeral });
    } else if (interaction.isButton()) {
      await buttons[interaction.customId]?.(interaction);
    } else if (interaction.isModalSubmit() && interaction.customId === IDS.FORM) {
      await tickets.onForm(interaction);
    }
  } catch (error) {
    console.error(error);
    const reply = { content: explain(error), flags: MessageFlags.Ephemeral };
    await (interaction.deferred || interaction.replied ? interaction.followUp(reply) : interaction.reply(reply)).catch(() => {});
  }
});

// Turns the Discord errors self-hosters hit most into something they can act on.
function explain(error) {
  switch (error.code) {
    case RESTJSONErrorCodes.MissingPermissions:
    case RESTJSONErrorCodes.MissingAccess:
      return "The bot is missing a permission for this. Ask an admin to check its role and the ticket categories (see README.md).";
    case RESTJSONErrorCodes.InvalidFormBodyOrContentType:
      return `Discord rejected a text or emoji from config.js: ${error.message.split("\n").slice(1).join(" ")}`;
    case RESTJSONErrorCodes.MaximumNumberOfGuildChannelsReached:
      return "This server has reached Discord's channel limit (500). Delete old channels to open new tickets.";
    default:
      return "Something went wrong. Check the bot's permissions and config.";
  }
}

client.on(Events.Error, console.error);
process.on("unhandledRejection", console.error);

async function stop(message) {
  if (message) console.error(`${message} See README.md.`);
  await client.destroy();
  process.exit(message ? 1 : 0);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

client.login(process.env.TOKEN).catch((error) => stop(`Could not log in: ${error.message}`));
