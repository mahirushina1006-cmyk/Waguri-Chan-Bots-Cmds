module.exports = {
  config: {
    name: "vip",
    version: "7.0",
    author: "Huraira Sajib",
    countDown: 5,
    role: 0,
    category: "vip",
    guide: {
      en: "✨ 𝐯𝐢𝐩 𝐛𝐮𝐲 <𝐝𝐚𝐲𝐬> ✨\n" +
          "✨ 𝐯𝐢𝐩 𝐚𝐝𝐝 @𝐮𝐬𝐞𝐫 (owner) ✨\n" +
          "✨ 𝐯𝐢𝐩 𝐫𝐞𝐦𝐨𝐯𝐞 @𝐮𝐬𝐞𝐫 (owner) ✨\n" +
          "✨ 𝐯𝐢𝐩 𝐥𝐢𝐬𝐭 ✨\n" +
          "✨ 𝐯𝐢𝐩 𝐜𝐡𝐞𝐜𝐤 ✨"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;
    const sub = args[0]?.toLowerCase();
    const now = Date.now();
    const ADMIN_UID = "100078792977084"; 

    const neon = (text) => `💫✨ ${text} ✨💫`;

    let targetID = null;
    if (messageReply) targetID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
    else if (args[1] && !isNaN(args[1])) targetID = args[1];

    /* 🛒 BUY VIP */
    if (sub === "buy") {
      const days = parseInt(args[1]);
      if (!days || days < 1 || days > 30)
        return message.reply(neon("❌ 𝐃𝐀𝐘𝐒 𝐌𝐔𝐒𝐓 𝐁𝐄 1–30"));

      const userData = await usersData.get(senderID);
      const money = userData.money || 0;
      const costPerDay = 2000000000;
      const totalCost = costPerDay * days;

      if (money < totalCost)
        return message.reply(neon(`❌ 𝐍𝐎𝐓 𝐄𝐍𝐎𝐔𝐆𝐇 𝐌𝐎𝐍𝐄𝐘\n💰 𝐍𝐄𝐄𝐃: ${totalCost.toLocaleString()}`));

      let currentExpire = (userData.data && userData.data.vipExpire > now) ? userData.data.vipExpire : now;
      const expire = currentExpire + (days * 24 * 60 * 60 * 1000);

      await usersData.set(senderID, {
        money: money - totalCost,
        data: { ...userData.data, isVip: true, vipExpire: expire }
      });

      return message.reply(
        neon(`👑 𝐕𝐈𝐏 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃`) + 
        `\n━━━━━━━━━━━━\n` +
        `📆 𝐃𝐀𝐘𝐒: ${days}\n` +
        `💵 𝐂𝐎𝐒𝐓: ${totalCost.toLocaleString()}\n` +
        `⏳ 𝐄𝐗𝐏𝐈𝐑𝐄: ${new Date(expire).toLocaleString()}`
      );
    }

    /* ➕ ADD VIP */
    if (sub === "add") {
      if (senderID !== ADMIN_UID) return message.reply(neon("❌ 𝐎𝐖𝐍𝐄𝐑 𝐎𝐍𝐋𝐘"));
      if (!targetID) return message.reply(neon("❌ 𝐌𝐞𝐧𝐭𝐢𝐨𝐧 / 𝐑𝐞𝐩𝐥𝐲 / 𝐔𝐈𝐃 𝐝𝐞।"));

      const userData = await usersData.get(targetID);
      await usersData.set(targetID, {
        data: { ...userData.data, isVip: true, vipExpire: now + 7 * 24 * 60 * 60 * 1000 }
      });

      return message.reply(neon(`👑 𝐕𝐈𝐏 𝐀𝐃𝐃𝐄𝐃 FOR ${targetID}`));
    }

    /* ➖ REMOVE VIP */
    if (sub === "remove") {
      if (senderID !== ADMIN_UID) return message.reply(neon("❌ 𝐎𝐖𝐍𝐄𝐑 𝐎𝐍𝐋𝐘"));
      if (!targetID) return message.reply(neon("❌ 𝐌𝐞𝐧𝐭𝐢𝐨𝐧 / 𝐑𝐞𝐩𝐥𝐲 / 𝐔𝐈𝐃 𝐝𝐞।"));

      const userData = await usersData.get(targetID);
      await usersData.set(targetID, {
        data: { ...userData.data, isVip: false, vipExpire: 0 }
      });

      return message.reply(neon(`🗑️ 𝐕𝐈𝐏 𝐑𝐄𝐌𝐎𝐕𝐄𝐃 FOR ${targetID}`));
    }

    /* 📜 VIP LIST */
    if (sub === "list") {
      const allUsers = await usersData.getAll();
      let vipUsers = allUsers.filter(u => u.data && u.data.isVip && u.data.vipExpire > now);

      if (vipUsers.length === 0) return message.reply(neon("❌ 𝐍𝐎 𝐕𝐈𝐏 𝐔𝐒𝐄𝐑𝐒"));

      let text = neon("👑 𝐕𝐈𝐏 𝐔𝐒𝐄𝐑𝐒") + "\n━━━━━━━━━━━━\n";
      vipUsers.forEach((u, i) => {
        text += `✨ ${i + 1}. ${u.name || "User"} | Exp: ${new Date(u.data.vipExpire).toLocaleDateString()}\n`;
      });

      return message.reply(text);
    }

    /* 🔍 CHECK VIP */
    if (sub === "check") {
      const userData = await usersData.get(senderID);
      if (userData.data && userData.data.isVip && userData.data.vipExpire > now) {
        return message.reply(neon(`🌟 𝐘𝐎𝐔 𝐀𝐑𝐄 𝐀 𝐕𝐈𝐏\n⏳ Exp: ${new Date(userData.data.vipExpire).toLocaleString()}`));
      }
      return message.reply(neon("❌ 𝐘𝐎𝐔 𝐀𝐑𝐄 𝐍𝐎𝐓 𝐀 𝐕𝐈𝐏"));
    }

    return message.reply(neon("❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃"));
  }
};