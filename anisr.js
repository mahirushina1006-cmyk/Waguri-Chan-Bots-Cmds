const { GoatWrapper } = require('fca-liane-utils');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper function to process and stream streamable buffers safely
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
    name: "anisearch",
    aliases: ["animeedit", "anisr"],
    author: "sajib",
    version: "2.0",
    shortDescription: {
      en: "Get cute anime edits using Vercel API",
    },
    longDescription: {
      en: "Search and download anime edit videos with a pookie theme layout",
    },
    category: "𝗠𝗘𝗗𝗜𝗔",
    guide: {
      en: "{p}{n} [anime name]",
    },
  },

  // Core execution block triggering on valid query matching
  onStart: async function ({ api, event, args }) {
    const query = args.join(' ');
    
    // Fallback boundary handling if the user submits an empty request
    if (!query) {
      return api.sendMessage(
        { body: "🎀 Pookie, please provide an anime name!\n✨ Example: !anisearch naruto" }, 
        event.threadID, 
        event.messageID
      );
    }

    const tempFilePath = path.join(os.tmpdir(), `pookie_ani_${Date.now()}.mp4`);

    try {
      // Direct integration using the updated Vercel API platform endpoint
      const response = await axios.get(`https://waguri-chan-animesearch-api.vercel.app/sajib-api/anisearch?keyword=${encodeURIComponent(query)}`);
      const videoData = response.data;
      
      // Support structural flexibility for either videoUrl or url response variables
      const finalVideoUrl = videoData.videoUrl || videoData.url;

      if (!finalVideoUrl) {
        return api.sendMessage({ body: `🌸 Aw, pookie... No edits found for "${query}".` }, event.threadID, event.messageID);
      }

      // Add loading reaction trigger to provide visual confirmation
      api.setMessageReaction("💝", event.messageID, (err) => {}, true);

      await downloadVideo(finalVideoUrl, tempFilePath);

      // Cute pookie layout presentation layout framework
      const pookieLayout = `╭━━━ 🎀 𝗣𝗢𝗢𝗞𝗜𝗘 𝗘𝗗𝗜𝗧𝗦 ━━━╮\n` +
                           `  🧸 𝖲𝖾𝖺𝗋𝖼𝗁: ${query.toUpperCase()}\n` +
                           `  ✨ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝖥𝗈𝗎𝗇𝖽 𝖥𝗈𝗋 𝖸𝗈𝗎!\n` +
                           `╰━━━━━━━━━━━━━━━━━━╯`;

      await api.sendMessage({
        body: pookieLayout,
        attachment: fs.createReadStream(tempFilePath),
      }, event.threadID, event.messageID);

      api.setMessageReaction("💖", event.messageID, (err) => {}, true);

    } catch (error) {
      console.error("Pookie Anime Search Logic Error:", error.message);
      api.sendMessage({ body: '✖ Aw pookie, an error occurred while fetching the video.' }, event.threadID, event.messageID);
    } finally {
      // Sequential disk memory cleanup configuration
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  },
};

const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });