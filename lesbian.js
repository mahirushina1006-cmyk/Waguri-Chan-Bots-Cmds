const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "lesbian",
    version: "8.0",
    author: "Huraira Sajib",
    countDown: 10,
    role: 0,
    category: "vip",
    guide: {
      en: "✨ {pn} @mention or Reply ✨"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    const { senderID, mentions, messageReply } = event;
    const now = Date.now();
    const neon = (text) => `💫✨ ${text} ✨💫`;

    // --- VIP Check ---
    const senderData = await usersData.get(senderID);
    const isVip = senderData.data && senderData.data.isVip && senderData.data.vipExpire > now;

    if (!isVip) {
      return message.reply(neon("❌ 𝐓𝐇𝐈𝐒 𝐈𝐒 𝐀 𝐕𝐈𝐏 𝐎𝐍𝐋𝐘 𝐂𝐎𝐌𝐌𝐀𝐍𝐃"));
    }

    // --- UID System (Reply / Mention / Sender) ---
    let uid;
    if (messageReply) {
      uid = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else {
      uid = senderID;
    }

    const targetData = await usersData.get(uid);
    const name = targetData.name || "User";

    message.reply(neon("👩‍❤‍👩 𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐋𝐞𝐬𝐛𝐢𝐚𝐧 𝐄𝐟𝐟𝐞𝐜𝐭... 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭"));

    try {
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      const response = await axios.get(avatarURL, { responseType: 'arraybuffer' });
      const img = await loadImage(Buffer.from(response.data, 'binary'));

      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // --- Lesbian Flag Colors (Sunset Theme) ---
      const colors = [
        "rgba(214, 41, 0, 0.4)",   // Dark Orange
        "rgba(255, 155, 85, 0.4)", // Light Orange
        "rgba(255, 255, 255, 0.4)",// White
        "rgba(212, 97, 166, 0.4)", // Light Pink
        "rgba(165, 0, 98, 0.4)"    // Dark Pink
      ];

      const stripeHeight = canvas.height / colors.length;
      for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
      }

      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
      
      const imgPath = path.join(cachePath, `lesbian_${uid}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      const percentage = Math.floor(Math.random() * 101);

      return message.reply({
        body: neon(`👩‍❤‍👩 𝐋𝐄𝐒𝐁𝐈𝐀𝐍 𝐂𝐇𝐄𝐂𝐊 (𝐕𝐈𝐏) 👩‍❤‍👩\n━━━━━━━━━━━━━━\n👤 𝐍𝐚𝐦𝐞: ${name}\n📊 𝐒𝐜𝐨𝐫𝐞: ${percentage}%\n━━━━━━━━━━━━━━\n${percentage > 50 ? "𝐂𝐨𝐧𝐟𝐢𝐫𝐦𝐞𝐝 𝐋𝐞𝐬𝐛𝐢𝐚𝐧! 🧡" : "𝐉𝐮𝐬𝐭 𝐚 𝐥𝐢𝐭𝐭𝐥𝐞 𝐛𝐢𝐭! 😉"}\n✨ 𝐎𝐰𝐧𝐞𝐫: Someone`),
        attachment: fs.createReadStream(imgPath)
      }, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });

    } catch (error) {
      console.error(error);
      return message.reply(neon("❌ 𝐄𝐫𝐫𝐨𝐫: 𝐂𝐚𝐧'𝐭 𝐠𝐞𝐭 𝐩𝐫𝐨𝐟𝐢𝐥𝐞 𝐩𝐢𝐜𝐭𝐮𝐫𝐞."));
    }
  }
};