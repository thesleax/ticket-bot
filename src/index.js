import { Client, GatewayIntentBits } from "discord.js";
const Bot = (global.bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
}));

import Utils from "./utils/utils.js";

Utils.event(Bot);
Utils.login(Bot);
