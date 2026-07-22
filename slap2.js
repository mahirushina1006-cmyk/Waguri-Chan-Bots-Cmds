const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "slap2",
    aliases: ["slapv2"],
    version: "1.0.3",
    author: "E'wr Sajib",
    countDown: 5,
    role: 0,
    shortDescription: "Slap a user with custom anime slap meme template and text mention",
    category: "fun",
    guide: {
      en: "{pn} @mention | Reply to a user message"
    }
  },

  onStart: async function ({ message, event, api, usersData }) {
    try {
      let targetID;

      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      } else {
        return message.reply("⚠️ Please mention someone or reply to a message to execute a slap.");
      }

      const senderID = event.senderID;
      api.setMessageReaction("🥊", event.messageID);

      // Fetch user names for proper text mention construction
      const senderName = await usersData.getName(senderID) || "User";
      const targetName = await usersData.getName(targetID) || "User";

      const templateUrl = "https://i.imgur.com/YjqM0TA.jpeg";

      // Robust buffer fetcher with standard browser User-Agent
      const getBuffer = async (url) => {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        return Buffer.from(response.data);
      };

      // Resilient avatar fetching with fallback mechanism
      const getAvatarBuffer = async (uid) => {
        const endpoints = [
          `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          `https://graph.facebook.com/${uid}/picture?type=large`
        ];

        for (const endpoint of endpoints) {
          try {
            return await getBuffer(endpoint);
          } catch (e) {
            // Attempt next endpoint on failure
          }
        }

        return await getBuffer("https://i.imgur.com/6V4q7L8.png");
      };

      // Concurrent downloading of required assets
      const [templateBuf, senderBuf, targetBuf] = await Promise.all([
        getBuffer(templateUrl),
        getAvatarBuffer(senderID),
        getAvatarBuffer(targetID)
      ]);

      const [templateImg, senderAvatar, targetAvatar] = await Promise.all([
        loadImage(templateBuf),
        loadImage(senderBuf),
        loadImage(targetBuf)
      ]);

      const width = templateImg.width;
      const height = templateImg.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Draw base meme template
      ctx.drawImage(templateImg, 0, 0, width, height);

      // 1. Position Left Character Face (Slapper)
      const senderRadius = width * 0.12;
      const senderX = width * 0.27;
      const senderY = height * 0.48;

      ctx.save();
      ctx.beginPath();
      ctx.arc(senderX, senderY, senderRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(senderAvatar, senderX - senderRadius, senderY - senderRadius, senderRadius * 2, senderRadius * 2);
      ctx.restore();

      // 2. Position Right Character Face (Victim)
      const targetRadius = width * 0.13;
      const targetX = width * 0.68;
      const targetY = height * 0.44;

      ctx.save();
      ctx.beginPath();
      ctx.arc(targetX, targetY, targetRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(targetAvatar, targetX - targetRadius, targetY - targetRadius, targetRadius * 2, targetRadius * 2);
      ctx.restore();

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);
      const outputPath = path.join(cacheDir, `slap2_${senderID}_${targetID}_${Date.now()}.png`);

      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", async () => {
        try {
          const replyText = `${senderName} slapped ${targetName}! 🥊💥`;

          await message.reply({
            body: replyText,
            mentions: [
              { tag: senderName, id: senderID },
              { tag: targetName, id: targetID }
            ],
            attachment: fs.createReadStream(outputPath)
          });

          setTimeout(() => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          }, 15000);
        } catch (deliveryErr) {
          console.error("Slap2 delivery pipeline error:", deliveryErr);
        }
      });

    } catch (error) {
      console.error("Slap2 execution runtime failure:", error);
      return message.reply("❌ An error occurred while generating the slap image.");
    }
  }
};