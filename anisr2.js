const { GoatWrapper } = require('fca-liane-utils');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function downloadVideo(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

module.exports = {
  config: {
    name: "anisr2",
    aliases: ["anisearch2", "ansr2"],
    author: "sajib",
    version: "1.5",
    shortDescription: {
      en: "Get anime edits",
    },
    longDescription: {
      en: "Search for anime edit videos using custom VPS API",
    },
    category: "𝗠𝗘𝗗𝗜𝗔",
    guide: {
      en: "{p}{n} [anime name]",
    },
  },

  // Primary operational lifecycle hook
  onStart: async function ({ api, event, args }) {
    const query = args.join(' ');
    
    // Fallback error messaging block targeting missing parameters
    if (!query) {
      return api.sendMessage(
        { body: "❌ Please provide an anime name.\nExample: !anisr2 naruto" }, 
        event.threadID, 
        event.messageID
      );
    }

    const tempFilePath = path.join(os.tmpdir(), `anisearch_${Date.now()}.mp4`);

    try {
      // Direct integration parsing targeting custom network VPS API endpoint
      const response = await axios.get(`http://187.127.141.81:3000/api/anisearch?keyword=${encodeURIComponent(query)}`);
      const videoData = response.data;

      if (!videoData || !videoData.videoUrl) {
        return api.sendMessage({ body: `🔎 No edits found for "${query}".` }, event.threadID, event.messageID);
      }

      await downloadVideo(videoData.videoUrl, tempFilePath);

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      await api.sendMessage({
        body: "",
        attachment: fs.createReadStream(tempFilePath),
      }, event.threadID, event.messageID);

    } catch (error) {
      console.error("Anisearch Error Logic Output:", error.message);
      api.sendMessage({ body: '❌ An error occurred while fetching the video from VPS API.' }, event.threadID, event.messageID);
    } finally {
      // Secure local space structural garbage cleanup loop execution
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  },
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });