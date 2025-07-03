import Discord from "discord.js";
const { ButtonStyle, TextInputStyle } = Discord;

export default {
  PREFIX: "" /* "!", ".", "-" */,
  TOKEN: "",
  PRESENCE: {
    NAME: "" /* "Hi" */,
    TYPE: "Playing" /* "Playing", "Streaming", "Listening", "Watching", "Competing", "Custom" */,
    STATUS: "idle" /* "online", "idle", "dnd", "offline" */,
  },
  GUILD_ID: "",
  TICKET: {
    CHANNEL: "" /* "ID" */,
    CATEGORY: "" /* "ID" */,
    ARCHIVE_CATEGORY: "" /* "ID" */,
    MESSAGE: "Click to create ticket!",
    SHOW_MODAL: false /* Set to false to create ticket directly without showing modal */,
    STAFF_ROLES: [] /* ["ROLE_ID", "ROLE_ID"] */,
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
        MIN_LENGTH: 1,
        MAX_LENGTH: 16,
        PLACE_HOLDER: "You can write your name.",
        REQUIRED: true,
      },
      {
        ID: "age",
        LABEL: "How old are you?",
        STYLE: TextInputStyle.Short,
        MIN_LENGTH: 2,
        MAX_LENGTH: 2,
        PLACE_HOLDER: "You can write your age.",
        REQUIRED: true,
      },
    ],
  },
};
