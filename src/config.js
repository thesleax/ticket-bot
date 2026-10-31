import { ButtonStyle, TextInputStyle } from "discord.js";

// The bot token is read from the TOKEN environment variable (see .env.example), never from this file.
export default {
  // Server the /ticket-panel command is registered in.
  GUILD_ID: "",

  // Category new tickets are created in, and the one archived tickets are moved to.
  CATEGORY_ID: "",
  ARCHIVE_CATEGORY_ID: "",

  // Roles that can see every ticket and approve, archive or delete them. The server owner always can.
  STAFF_ROLE_IDS: [] /* ["ROLE_ID", "ROLE_ID"] */,

  PRESENCE: {
    NAME: "" /* "Hi" */,
    TYPE: "Playing" /* "Playing", "Streaming", "Listening", "Watching", "Competing", "Custom" */,
    STATUS: "idle" /* "online", "idle", "dnd", "invisible" */,
  },

  PANEL: {
    TITLE: "",
    DESCRIPTION: "Click to create ticket!",
    BUTTON: { LABEL: "Open Ticket!", EMOJI: "🎫", STYLE: ButtonStyle.Primary },
  },

  TICKET_BUTTONS: {
    APPROVE: { LABEL: "Confirm Ticket", EMOJI: "✅", STYLE: ButtonStyle.Success },
    ARCHIVE: { LABEL: "Archive Ticket", EMOJI: "🎫", STYLE: ButtonStyle.Secondary },
    DELETE: { LABEL: "Delete Ticket", EMOJI: "🎟️", STYLE: ButtonStyle.Danger },
  },

  // true: the member can read their ticket but only write after staff press Confirm. Works with and without the form.
  LOCK_UNTIL_CONFIRMED: false,

  // Spam protection.
  // COOLDOWN_SECONDS: how long a member waits after opening a ticket before opening another. 0 turns it off. Staff skip it.
  // MAX_OPEN_TICKETS: how many channels CATEGORY_ID can hold before new tickets are refused. Discord's own limit is 50.
  LIMITS: { COOLDOWN_SECONDS: 60, MAX_OPEN_TICKETS: 50 },

  // true: members fill in the QUESTIONS form before the ticket opens. false: the ticket opens with one click.
  SHOW_MODAL: false,

  // Questions of that form. Discord allows at most 5.
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

  COLOR: 0x5865f2,
};
