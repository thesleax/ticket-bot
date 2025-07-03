import Utils from "../utils/utils.js";
import Config from "../config.js";
import Discord from "discord.js";
const {
  ButtonBuilder,
  ActionRowBuilder,
  PermissionFlagsBits,
  InteractionType,
  ChannelType,
  MessageFlags,
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

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (Channel) {
          interaction.followUp({
            content: `You already have a ticket request.`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          let PermissionsArray = [
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ReadMessageHistory,
              ],
              deny: [PermissionFlagsBits.SendMessages],
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
                flags: MessageFlags.Ephemeral,
              });

              const staffMentions = Config.TICKET.STAFF_ROLES.map(
                (roleId) => `<@&${roleId}>`
              ).join(", ");
              Channel.send({
                content: staffMentions,
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
      if (Config.TICKET.SHOW_MODAL) {
        await interaction.showModal(Utils.modal());
      } else {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const Channel = interaction.guild.channels.cache.find(
          (x) => x.name === "ticket" + "-" + interaction.user.id
        );

        if (Channel) {
          interaction.followUp({
            content: `You already have a ticket request.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

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
              flags: MessageFlags.Ephemeral,
            });

            const staffMentions = Config.TICKET.STAFF_ROLES.map(
              (roleId) => `<@&${roleId}>`
            ).join(", ");
            Channel.send({
              content: staffMentions,
              embeds: [
                Utils.embed(
                  `Ticket Creator Member Information: \n${interaction.user} (\`${interaction.user.id}\`)`,
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

    if (interaction.customId === "successTicket") {
      if (
        !Config.TICKET.STAFF_ROLES.some((x) =>
          interaction.member.roles.cache.has(x)
        ) &&
        ![interaction.guild.ownerId].includes(interaction.user.id)
      ) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        interaction.followUp({
          content: `Only authorities can use the ticket validation system.`,
          flags: MessageFlags.Ephemeral,
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

        interaction.channel.permissionOverwrites.edit(
          interaction.channel.name.replace("ticket-", ""),
          { SendMessages: true }
        );

        interaction.followUp({
          content: `The ticket has been successfully approved.`,
          flags: MessageFlags.Ephemeral,
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
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (
        !Config.TICKET.STAFF_ROLES.some((x) =>
          interaction.member.roles.cache.has(x)
        ) &&
        ![interaction.guild.ownerId].includes(interaction.user.id)
      )
        return interaction.followUp({
          content: `Only authorities can use the ticket archive system.`,
          flags: MessageFlags.Ephemeral,
        });

      if (interaction.channel.name.startsWith("archive-"))
        return interaction.followUp({
          content: `This ticket is already archived.`,
          flags: MessageFlags.Ephemeral,
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

          // Keep only delete button after archiving
          const deleteButton = ButtonBuilder.from(
            interaction.message.components[0].components[2]
          );
          const newRow = new ActionRowBuilder().addComponents([deleteButton]);

          interaction.message.edit({
            embeds: [
              Utils.embed(
                interaction.message.embeds.map((x) => x.description).join(""),
                interaction.guild,
                Bot,
                ""
              ),
            ],
            components: [newRow],
          });

          interaction.followUp({
            content: `Ticket successfully archived.`,
            flags: MessageFlags.Ephemeral,
          });
        });
    }

    if (interaction.customId === "deleteTicket") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const userId = interaction.channel.name.replace("ticket-", "");
      const isTicketOwner = userId === interaction.user.id;
      const isApproved =
        interaction.message.components[0].components[0].data.disabled === true;

      if (isTicketOwner && isApproved) {
        return interaction.followUp({
          content: `The support request has been approved by the authorities, you can no longer delete it.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!isTicketOwner && !Utils.isStaffMember(interaction.member)) {
        return;
      }

      // First, remove all buttons from the message
      await interaction.message.edit({
        embeds: [
          Utils.embed(
            interaction.message.embeds.map((x) => x.description).join(""),
            interaction.guild,
            Bot,
            ""
          ),
        ],
        components: [], // Remove all buttons
      });

      await interaction.followUp({
        content: `Your request has been received successfully after \`5 seconds\` the channel will be deleted automatically.`,
        flags: MessageFlags.Ephemeral,
      });

      setTimeout(() => {
        interaction.channel.delete().catch(() => undefined);
      }, 1000 * 5);
    }
  });
};
