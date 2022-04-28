import { Client } from "discord.js";
const Bot = (global.bot = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"],
}));

import Utils from "./utils/utils.js";
import Modals from "discord-modals";

Modals(Bot);

Utils.event(Bot);
Utils.login(Bot);
