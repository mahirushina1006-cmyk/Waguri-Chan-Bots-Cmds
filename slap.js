const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    version: "1.2",
    author: "NTKhang x Sajib",
    countDown: 5,
    role: 0,
    shortDescription: "Batslap an image of a tagged user",
    longDescription: "Generate a batslap meme image using your avatar and the tagged user's avatar.",
    category: "image",
    guide: {
      en: "   {pn} @tag [optional text]"
    }
  },

  langs: {
    en: {
      noTag: "❌ | You must tag the person you want to slap!",
      error: "❌ | An error occurred while generating the image."
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];

    if (!uid2) {
      return message.reply(getLang("noTag"));
    }

    try {
      const avatarURL1 = await usersData.getAvatarUrl(uid1);
      const avatarURL2 = await usersData.getAvatarUrl(uid2);

      // Ensure the tmp directory exists to prevent folder missing errors
      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      // Generate the batslap image
      const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
      const pathSave = path.join(tmpDir, `${uid1}_${uid2}_batslap.png`);
      
      fs.writeFileSync(pathSave, Buffer.from(img));

      // Fix the mention text replacement bug
      const mentionText = event.mentions[uid2] || "";
      const content = args.join(" ").replace(mentionText, "").trim();

      message.reply({
        body: content || "sʟᴀᴘ 🥴😵",
        attachment: fs.createReadStream(pathSave)
      }, () => {
        if (fs.existsSync(pathSave)) {
          fs.unlinkSync(pathSave);
        }
      });
    } catch (error) {
      console.error(error);
      return message.reply(getLang("error"));
    }
  }
};