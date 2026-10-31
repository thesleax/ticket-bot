# 🎫 Discord Ticket Bot

A small, self-hosted support ticket bot for one Discord server, built on **discord.js v14** (latest).
Members press a button, optionally fill in a short form, and get a private channel with your staff.

## Features

- **Ticket panel** posted with the `/ticket-panel` slash command
- **One-click tickets**, or an optional form (up to 5 questions) before a ticket opens
- **Private channels**: only the member, your staff roles and the server owner can see them
- **Confirm, archive, delete** buttons for staff. Members can delete their own ticket until staff approve it
- **One open ticket per member**, and a double click never opens two
- **Spam protection**: a cooldown between tickets and a cap on open tickets, both set in `config.js`
- Needs only the `Guilds` intent: no privileged intents, no message content access
- Errors are logged and answered in Discord instead of crashing the bot
- Checks your ids at startup and tells you exactly which one is wrong

## Setup

### 1. Create the bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications), create an application and copy the token from the **Bot** page.
2. Invite it with this link, replacing `CLIENT_ID` with your application id:

   ```
   https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot+applications.commands&permissions=268553232
   ```

   That grants View Channels, Send Messages, Embed Links, Attach Files, Read Message History, Manage Channels and Manage Roles.
   The bot's role must sit **above** your staff roles, and the staff roles must be mentionable if you want them pinged.

### 2. Install

You need the current LTS version of [Node.js](https://nodejs.org).

```sh
git clone https://github.com/thesleax/ticket-bot.git
cd ticket-bot
npm install
```

### 3. Configure

Copy `.env.example` to `.env` and put your token in it:

```
TOKEN=your-bot-token
```

Then fill in `src/config.js` (turn on **Developer Mode** in Discord to copy ids with right click):

| Setting | What it is |
|---|---|
| `GUILD_ID` | Your server's id |
| `CATEGORY_ID` | Category new tickets are created in |
| `ARCHIVE_CATEGORY_ID` | Category archived tickets are moved to |
| `STAFF_ROLE_IDS` | Roles that handle tickets, e.g. `["123", "456"]` |
| `PRESENCE` | The bot's status text |
| `PANEL` | Title, text and button (label, emoji, color) of the ticket panel |
| `TICKET_BUTTONS` | Label, emoji and color of the Confirm, Archive and Delete buttons |
| `LOCK_UNTIL_CONFIRMED` | `true`: members can read their ticket but write only after staff press Confirm. Works with or without the form |
| `LIMITS` | `COOLDOWN_SECONDS`: wait after opening a ticket before opening another (`0` = off, staff skip it). `MAX_OPEN_TICKETS`: channels the ticket category can hold before new tickets are refused (Discord allows 50) |
| `SHOW_MODAL` | `false`: tickets open with one click. `true`: members fill in the form first |
| `QUESTIONS` | The questions of that form: label, style, min/max length, placeholder, required |
| `COLOR` | Embed color |

### 4. Run

```sh
npm start
```

In the channel where members should open tickets, run `/ticket-panel` (administrators only).

To keep it running after you close the terminal, use a process manager such as [pm2](https://pm2.keymetrics.io): `pm2 start npm --name ticket-bot -- start`.

## How a ticket works

1. A member presses **Open ticket** (and answers the form when `SHOW_MODAL` is on).
2. The bot creates `ticket-<user id>` in your ticket category and pings your staff roles.
3. Staff press **Confirm** to take the ticket. After that, only staff can delete it, and with `LOCK_UNTIL_CONFIRMED` on the member can start writing.
4. **Archive** moves the channel to the archive category and removes the member's access. **Delete** removes the channel after 5 seconds.

## Changelog

### 1.1.0 (October 31, 2026)
- New `LIMITS` option: a cooldown between a member's tickets (60 seconds by default, staff skip it) and a cap on open tickets, so nobody can flood the server with ticket channels
- A full ticket or archive category (Discord allows 50 channels) now gets a clear message instead of "Something went wrong"
- Configs without `LIMITS` keep working with the defaults
- Fixed: with `LOCK_UNTIL_CONFIRMED` on, members could still write in their ticket through threads before staff confirmed it

### 1.0.0 (October 30, 2026)
- Rewritten for discord.js 14.28: the `/ticket-panel` slash command replaces the prefix command, and forms use the new modal label components
- Only the `Guilds` intent is needed now. The privileged Message Content and Server Members intents are no longer required
- The token moved to `.env`
- Fixed: one failed Discord request could crash the bot
- Fixed: double clicks opened two tickets
- Fixed: the Delete button never answered members who weren't allowed to use it
- Fixed: an empty prefix answered every "ticket" message
- Removed duplicated and unused code
- Panels and tickets posted by older versions keep working after the update
- New `LOCK_UNTIL_CONFIRMED` option: members write only after staff confirm, with or without the form
- Your ids are checked at startup, and the bot shuts down cleanly on Ctrl+C

### 0.0.3 (July 3, 2025)
- Ticket creation with and without a modal
- discord.js 14.21.0

## License

[MIT](LICENSE)
