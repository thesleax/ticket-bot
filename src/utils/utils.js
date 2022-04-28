import Fs from "fs";
import { MessageEmbed, MessageActionRow, MessageButton } from "discord.js";
import { Modal, TextInputComponent } from "discord-modals";
import Config from "../config.js";
class Utils {
  static login(Bot) {
    Bot.login(Config.TOKEN)
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
    const Embed = new MessageEmbed()
      .setAuthor({
        name: `${Guild.name} Ticket System`,
        iconURL: Guild.iconURL({ dynamic: true }),
      })
      .setColor("RANDOM")
      .setDescription(Content)
      .setFooter({
        text: Bot.user.username,
        iconURL: Bot.user.avatarURL({ dynamic: true }),
      })
      .setTimestamp();
    if (User) {
      Embed.setThumbnail(User.avatarURL({ dynamic: true }));
    } else {
      Embed.setThumbnail(Guild.iconURL({ dynamic: true }));
    }

    return Embed;
  }

  static button(Style, Label, Emoji, Id, Disabled) {
    const Row = new MessageActionRow().addComponents(
      new MessageButton()
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
      const Button = new MessageButton()
        .setCustomId(x.ID)
        .setLabel(x.LABEL)
        .setStyle(x.STYLE)
        .setEmoji(x.EMOTE)
        .setDisabled(x.DISABLED);

      Buttons.push(Button);
    });

    let Row = new MessageActionRow().addComponents(Buttons);

    return Row;
  }

  static modal() {
    let Inputs = [];

    Config.TICKET.QUESTIONS.map((v) => {
      const Input = new TextInputComponent()
        .setCustomId(v.ID)
        .setLabel(v.LABEL)
        .setStyle(v.STYLE)
        .setMinLength(v.MIN_LENGTH)
        .setMaxLength(v.MAX_LENGTH)
        .setPlaceholder(v.PLACE_HOLDER)
        .setRequired(v.REQUIRED);

      Inputs.push(Input);
    });

    let Modals = new Modal()
      .setCustomId("ticket")
      .setTitle("Ticket Creation Request")
      .addComponents(Inputs);

    return Modals;
  }
}

export default Utils;
