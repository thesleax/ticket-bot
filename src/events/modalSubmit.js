import { Permissions } from "discord.js";
import Config from "../config.js";
import Utils from "../utils/utils.js";

export default (Bot) => {
  Bot.on("modalSubmit", async (modal) => {
    if (modal.customId === "ticket") {
      let Questions = Config.TICKET.QUESTIONS.map((x) => x.LABEL);
      let Value = modal.fields.map((x) => x.value);
      let Output = Value.map((x, i) => ({ Questions: Questions[i], Value: x }));
      let Content = Output.map(
        (x, index) =>
          `\n\`Question ${index + 1}:\` **${x.Questions}** \n\`Reply:\` **${
            x.Value
          }**`
      ).join("\n");

      const Channel = modal.guild.channels.cache.find(
        (x) => x.name === "ticket" + "-" + modal.user.id
      );

      await modal.deferReply({ ephemeral: true });

      if (Channel) {
        modal.followUp({
          content: `You already have a ticket request.`,
          ephemeral: true,
        });
      } else {
        let PermissionsArray = [
          {
            id: modal.user.id,
            allow: [
              Permissions.FLAGS.VIEW_CHANNEL,
              Permissions.FLAGS.READ_MESSAGE_HISTORY,
              Permissions.FLAGS.SEND_MESSAGES,
            ],
          },
          {
            id: modal.guild.id,
            deny: [Permissions.FLAGS.VIEW_CHANNEL],
          },
        ];

        Config.TICKET.STAFF_ROLES.map((x) => {
          PermissionsArray.push({
            id: x,
            allow: [
              Permissions.FLAGS.VIEW_CHANNEL,
              Permissions.FLAGS.READ_MESSAGE_HISTORY,
              Permissions.FLAGS.SEND_MESSAGES,
            ],
          });
        });

        modal.guild.channels
          .create("ticket" + "-" + modal.user.id, {
            type: "GUILD_TEXT",
            parent: Config.TICKET.CATEGORY,
            permissionOverwrites: PermissionsArray,
          })
          .then(async (Channel) => {
            modal.followUp({
              content:
                "Hey! Your ticket request has been successfully created.",
              ephemeral: true,
            });

            Channel.send({
              embeds: [
                Utils.embed(
                  `Ticket Creator Member Information: \n${modal.user} (\`${modal.user.id}\`) \n${Content}`,
                  modal.guild,
                  Bot,
                  modal.user
                ),
              ],
              components: [Utils.ticketButton()],
            });
          });
      }
    }
  });
};
