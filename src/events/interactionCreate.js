import Utils from "../utils/utils.js";
import Config from "../config.js";
import Discord from "discord.js";
const {
  ButtonBuilder,
  ActionRowBuilder,
  PermissionFlagsBits,
  InteractionType,
  ChannelType,
} = Discord;

export default (Bot) => {
  Bot.on("interactionCreate", async (interaction) => {
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === "ticket") {
        let Questions = Config.TICKET.QUESTIONS.map((x) => x.LABEL);

        let fields = [];

        [interaction.fields].map((z) =>
          z.fields.map((x) => {
            fields.push(x);
          })
        );

        let Value = fields.map((x) => x.value);
        let Output = Value.map((x, i) => ({
          Questions: Questions[i],
          Value: x,
        }));
        let Content = Output.map(
          (x, index) =>
            `\n\`Question ${index + 1}:\` **${x.Questions}** \n\`Reply:\` **${
              x.Value
            }**`
        ).join("\n");

        const Channel = interaction.guild.channels.cache.find(
          (x) => x.name === "ticket" + "-" + interaction.user.id
        );

        await interaction.deferReply({ ephemeral: true });

        if (Channel) {
          interaction.followUp({
            content: `You already have a ticket request.`,
            ephemeral: true,
          });
        } else {
          let PermissionsArray = [
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.SendMessages,
              ],
            },
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
          ];

          Config.TICKET.STAFF_ROLES.map((x) => {
            PermissionsArray.push({
              id: x,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.SendMessages,
              ],
            });
          });

          interaction.guild.channels
            .create({
              name: "ticket" + "-" + interaction.user.id,
              type: ChannelType.GuildText,
              parent: Config.TICKET.CATEGORY,
              permissionOverwrites: PermissionsArray,
            })
            .then(async (Channel) => {
              interaction.followUp({
                content:
                  "Hey! Your ticket request has been successfully created.",
                ephemeral: true,
              });

              Channel.send({
                embeds: [
                  Utils.embed(
                    `Ticket Creator Member Information: \n${interaction.user} (\`${interaction.user.id}\`) \n${Content}`,
                    interaction.guild,
                    Bot,
                    interaction.user
                  ),
                ],
                components: [Utils.ticketButton()],
              });
            });
        }
      }
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === "ticket") {
      await interaction.showModal(Utils.modal());
    }

    if (interaction.customId === "successTicket") {
      if (
        !Config.TICKET.STAFF_ROLES.some((x) =>
          interaction.member.roles.cache.has(x)
        ) &&
        ![interaction.guild.ownerId].includes(interaction.user.id)
      ) {
        await interaction.deferReply({ ephemeral: true });

        interaction.followUp({
          content: `Only authorities can use the ticket validation system.`,
          ephemeral: true,
        });

        return;
      } else {
        await interaction.update({
          components: [
            new ActionRowBuilder({
              components: [
                ButtonBuilder.from(
                  interaction.message.components[0].components[0]
                ).setDisabled(true),
                ButtonBuilder.from(
                  interaction.message.components[0].components[1]
                ),
                ButtonBuilder.from(
                  interaction.message.components[0].components[2]
                ),
              ],
            }),
          ],
        });

        interaction.followUp({
          content: `The ticket has been successfully approved.`,
          ephemeral: true,
        });

        interaction.channel.send({
          content: `Heyy! <@!${interaction.channel.name.replace(
            "ticket-",
            ""
          )}>, ticket has been successfully approved by the authorities.`,
        });

        return;
      }
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

      let User = interaction.channel.name.replace("ticket-", "");

      if ([User].includes(interaction.user.id)) {
        if (
          interaction.message.components[0].components[0].data.disabled === true
        )
          return interaction.followUp({
            content: `The support request has been approved by the authorities, you can no longer delete it.`,
            ephemeral: true,
          });
      } else {
        if (
          !Config.TICKET.STAFF_ROLES.some((x) =>
            interaction.member.roles.cache.has(x)
          ) &&
          ![interaction.guild.ownerId].includes(interaction.user.id)
        )
          return;
      }

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
