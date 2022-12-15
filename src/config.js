import Discord from "discord.js";
const { ButtonStyle, TextInputStyle } = Discord;

export default {
  PREFIX: "t!",
  TOKEN: "MTA1MzAxMDY1OTc5NDc1OTY5MA.GI6rZ_.nfg4Un79RcPubEcm3sSmCNY7v22Y7tBs4AJALA",
  ACTIVITY: { NAME: "", TYPE: "PLAYING" },
  GUILD_ID: "1039223084567240774",
  TICKET: {
    CHANNEL: "1052996330269704272", 
    CATEGORY: "1053006380732260483",
    ARCHIVE_CATEGORY: "1053009489399394394",
    MESSAGE: "Ticket Acmak icin TIKLA!",
    STAFF_ROLES: [1052996605646741524],
    BUTTONS: [
      {
        STYLE: ButtonStyle.Success,
        LABEL: "Confirm Ticket",
        EMOTE: "✅",
        ID: "successTicket",
        DISABLED: false,
      },
      {
        STYLE: ButtonStyle.Secondary,
        LABEL: "Archive Ticket",
        EMOTE: "🎫",
        ID: "archiveTicket",
        DISABLED: false,
      },
      {
        STYLE: ButtonStyle.Danger,
        LABEL: "Delete Ticket",
        EMOTE: "🎟️",
        ID: "deleteTicket",
        DISABLED: false,
      },
    ],
    QUESTIONS: [
      {
        ID: "name",
        LABEL: "What is your name?",
        STYLE: TextInputStyle.Short,
        MIN_LENGTH: 0,
        MAX_LENGTH: 16,
        PLACE_HOLDER: "You can write your name.",
        REQUIRED: true,
      },
      {
        ID: "age",
        LABEL: "How old are you?",
        STYLE: TextInputStyle.Short,
        MIN_LENGTH: 0,
        MAX_LENGTH: 16,
        PLACE_HOLDER: "You can write your age.",
        REQUIRED: true,
      },
    ],
  },
};
