const os = require("os");

module.exports = {
  config: {
    name: "status2",
    aliases: ["rtm2"],
    version: "2.0",
    author: "Huraira Sajib",
    role: 0,
    category: "system",
    guide: { en: "status2 / rtm2" },
    usePrefix: false
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const allUsers = await usersData.getAll();
    const allThreads = await threadsData.getAll();
    const ping = Date.now() - event.timestamp;

    // RAM Calculation
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedRam = (totalRam - freeRam).toFixed(2);

    // CPU Calculation
    const cpuModel = os.cpus()[0].model;
    const cpuCore = os.cpus().length;
    const cpuUsage = ((os.loadavg()[0] / cpuCore) * 100).toFixed(1);

    const platform = `${os.type()} ${os.release()}`;
    const nodeVersion = process.version;
    const line = "✨──────────────────✨";

    const msg = `╭─── • ◈ • ───╮
  🎀 SYSTEM STATUS 🎀
╰─── • ◈ • ───╯
${line}

╭─❍「 👥 BOT INFO 」
├─ Users      : ${allUsers.length}
├─ Groups     : ${allThreads.length}
├─ Commands   : ${global.GoatBot.commands.size}
├─ Uptime     : ${days}D ${hours}H ${minutes}M ${seconds}S
├─ Ping       : ${ping}ms
╰────────────────╯

╭─❍「 🧠 MEMORY 」
├─ RAM Used   : ${usedRam} GB
├─ RAM Free   : ${freeRam} GB
├─ RAM Total  : ${totalRam} GB
╰────────────────╯

╭─❍「 ⚙️ CPU INFO 」
├─ CPU Core   : ${cpuCore}
├─ CPU Usage  : ${cpuUsage}%
├─ Processor  :
│  ${cpuModel}
╰────────────────╯

╭─❍「 💽 SYSTEM 」
├─ System     : ${platform}
├─ NodeJS     : ${nodeVersion}
├─ Status     : Running Smoothly ✅
╰────────────────╯

╭─❍「 👑 OWNER 」
├─ Name       : Sajibx7 
├─ Status     : Active ✔︎
╰────────────────╯
${line}`;

    return api.sendMessage(msg, event.threadID, event.messageID);
  }
};