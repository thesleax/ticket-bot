import { showModal } from "discord-modals";
import Utils from "../utils/utils.js";
import Config from "../config.js";

export default (Bot) => {
  Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "ticket") {
      showModal(Utils.modal(), {
        client: Bot,
        interaction: interaction,
      });
    }

    if (interaction.customId === "successTicket") {
      await interaction.deferReply({ ephemeral: true });

      if (
        !Config.TICKET.STAFF_ROLES.some((x) =>
          interaction.member.roles.cache.has(x)
        ) &&
        ![interaction.guild.ownerId].includes(interaction.user.id)
      )
        return interaction.followUp({
          content: `Only authorities can use the ticket validation system.`,
          ephemeral: true,
        });

      interaction.message.components[0].components[0].setDisabled(true);

      interaction.update({
        components: interaction.message.components,
      });

      interaction.channel
        .send({
          content: `Heyy! <@!${interaction.channel.name.replace(
            "ticket-",
            ""
          )}>, ticket has been successfully approved by the authorities.`,
        })
        .then((msg) => setTimeout(() => msg.delete(), 1000 * 5));
    }

    if (interaction.customId === "archiveTicket") {
      await interaction.deferReply({ ephemeral: true });

      if (
        !Config.TICKET.STAFF_ROLES.some((x) =>
          interaction.member.roles.cache.has(x)
        ) &&
        ![interaction.guild.ownerId].includes(interaction.user.id)
      )
        return interaction.followUp({
          content: `Only authorities can use the ticket archive system.`,
          ephemeral: true,
        });

      if (interaction.channel.parentId === Config.TICKET.ARCHIVE_CATEGORY)
        return interaction.followUp({
          content: `This ticket is already archived.`,
          ephemeral: true,
        });

      let Parent = interaction.guild.channels.cache.get(
        Config.TICKET.ARCHIVE_CATEGORY
      );

      interaction.channel.permissionOverwrites.delete(
        interaction.channel.name.replace("ticket-", "")
      );

      interaction.channel
        .setParent(Parent.id, { lockPermissions: false })
        .then(async (x) => {
          x.setName(interaction.channel.name.replace("ticket", "archive"));

          interaction.message.edit({
            embeds: [
              Utils.embed(
                interaction.message.embeds.map((x) => x.description).join(""),
                interaction.guild,
                Bot,
                ""
              ),
            ],
            components: [],
          });

          interaction.followUp({
            content: `Ticket successfully archived.`,
            ephemeral: true,
          });
        });
    }

    if (interaction.customId === "deleteTicket") {
      await interaction.deferReply({ ephemeral: true });

      const User = interaction.channel.name.replace("ticket-", "");

      if (User !== interaction.user.id)
        return interaction.followUp({
          content: `You don't own the ticket.`,
          ephemeral: true,
        });

      if (
        !Config.TICKET.STAFF_ROLES.some((x) =>
          interaction.member.roles.cache.has(x)
        ) &&
        ![interaction.guild.ownerId, User].includes(interaction.user.id)
      )
        return interaction.followUp({
          content: `Only authorities can use the ticket deletion system.`,
          ephemeral: true,
        });

      interaction.followUp({
        content: `Your request has been received successfully after \`5 seconds\` the channel will be deleted automatically.`,
        ephemeral: true,
      });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {
          return undefined;
        });
      }, 1000 * 5);
    }
  });
};
