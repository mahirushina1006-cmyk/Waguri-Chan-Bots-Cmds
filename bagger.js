const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "bagger",
    aliases: ["fokir"],
    version: "1.0.0",
    author: "E'wr Sajib",
    countDown: 5,
    role: 0,
    shortDescription: "Designate a target user as a beggar using custom template",
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
        targetID = event.senderID;
      }

      api.setMessageReaction("🥺", event.messageID);

      const targetName = await usersData.getName(targetID) || "User";
      const templateUrl = "https://i.imgur.com/NX4KgmO.jpeg";

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
            // Attempt next fallback endpoint
          }
        }

        return await getBuffer("https://i.imgur.com/6V4q7L8.png");
      };

      // Concurrent downloading of required assets
      const [templateBuf, targetBuf] = await Promise.all([
        getBuffer(templateUrl),
        getAvatarBuffer(targetID)
      ]);

      const [templateImg, targetAvatar] = await Promise.all([
        loadImage(templateBuf),
        loadImage(targetBuf)
      ]);

      const width = templateImg.width;
      const height = templateImg.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Render base beggar template
      ctx.drawImage(templateImg, 0, 0, width, height);

      // Position target face over the beggar head area
      const avatarRadius = width * 0.17;
      const avatarX = width * 0.55;
      const avatarY = height * 0.24;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        targetAvatar,
        avatarX - avatarRadius,
        avatarY - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      );
      ctx.restore();

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);
      const outputPath = path.join(cacheDir, `bagger_${targetID}_${Date.now()}.png`);

      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", async () => {
        try {
          const replyText = `Please give some coins! ${targetName} is begging on the street! 🥺🤲`;

          await message.reply({
            body: replyText,
            mentions: [{ tag: targetName, id: targetID }],
            attachment: fs.createReadStream(outputPath)
          });

          setTimeout(() => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          }, 15000);
        } catch (deliveryErr) {
          console.error("Bagger delivery pipeline error:", deliveryErr);
        }
      });

    } catch (error) {
      console.error("Bagger execution runtime failure:", error);
      return message.reply("❌ An error occurred while generating the beggar image.");
    }
  }
};
