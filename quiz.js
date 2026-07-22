const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// MAIN CONFIGURATION BLOCK
const CONFIG = {
    owners: ["100078792977084", "61588296072377"] // Authorized System Owners
};

module.exports = {
    config: {
        name: "quiz",
        aliases: ["qz"],
        version: "1.7.0",
        author: "Sa'Jibx7",
        countDown: 5,
        role: 0,
        shortDescription: "Play a stylized quiz game with dynamic metrics",
        longDescription: "Play real-time quiz games fetched directly from the database, earn/lose coins & exp, view top players, manage unlimited access, and check active categories.",
        category: "game",
        guide: {
            en: "{p}quiz [category]\n\nSubcommands:\n• {p}quiz top\n• {p}quiz list\n• {p}quiz -unlm [add/remove/list] [uid]"
        }
    },

    onStart: async function (context) {
        const api = context.api;
        const event = context.event;
        const args = context.args;
        const usersData = context.usersData;

        const threadID = event.threadID;
        const messageID = event.messageID;
        const senderID = event.senderID;

        // Anti-Author Modification Guard
        if (this.config.author !== "Sa'Jibx7") {
            return api.sendMessage("❌ [SECURITY ALERT] Unauthorized modification detected. Core functions locked.", threadID, messageID);
        }

        // Resilient database path resolution using process root
        const dbPath = path.join(process.cwd(), "tmp", "quiz_db.json");
        fs.ensureDirSync(path.dirname(dbPath));
        
        let quizDb = { unlimited: [], players: {} };
        if (fs.existsSync(dbPath)) {
            try {
                quizDb = fs.readJsonSync(dbPath);
                if (!quizDb.unlimited) quizDb.unlimited = [];
                if (!quizDb.players) quizDb.players = {};
            } catch (e) {
                fs.writeJsonSync(dbPath, quizDb);
            }
        } else {
            fs.writeJsonSync(dbPath, quizDb);
        }

        const input = args[0] ? args[0].toLowerCase() : "";

        // 1. Unlimited UID Authorization Manager
        if (input === "-unlm" || input === "unlm") {
            if (!CONFIG.owners.includes(senderID)) {
                return api.sendMessage("❌ [SECURITY] Access Denied. Only system owners can manage authorization matrices.", threadID, messageID);
            }

            const action = args[1] ? args[1].toLowerCase() : "";
            const targetUID = args[2];

            // Subcommand: List Unlimited Users and Owners
            if (action === "list") {
                let listMsg = "🛡️ ── UNLIMITED ACCESS MATRIX ── 🛡️\n──────────────────────────────\n";
                listMsg += "👥 SYSTEM OWNERS:\n";
                CONFIG.owners.forEach(owner => {
                    listMsg += `• ${owner}\n`;
                });
                listMsg += "\n⚡ AUTHORIZED USERS:\n";
                if (quizDb.unlimited.length === 0) {
                    listMsg += "• No external users authorized yet.\n";
                } else {
                    quizDb.unlimited.forEach(uid => {
                        listMsg += `• ${uid}\n`;
                    });
                }
                listMsg += "──────────────────────────────";
                return api.sendMessage(listMsg, threadID, messageID);
            }

            if (!action) {
                return api.sendMessage("💡 Usage:\n• {p}quiz -unlm add [UID]\n• {p}quiz -unlm remove [UID]\n• {p}quiz -unlm list", threadID, messageID);
            }

            if (action === "add") {
                if (!targetUID) {
                    return api.sendMessage("⚠️ Please specify a valid UID to authorize.", threadID, messageID);
                }
                if (quizDb.unlimited.includes(targetUID)) {
                    return api.sendMessage(`⚠️ UID ${targetUID} is already on the unlimited list.`, threadID, messageID);
                }
                quizDb.unlimited.push(targetUID);
                fs.writeJsonSync(dbPath, quizDb);
                return api.sendMessage(`✅ Successfully authorized unlimited access for UID: ${targetUID}`, threadID, messageID);
            }

            if (action === "remove" || action === "delete" || action === "rm") {
                if (!targetUID) {
                    return api.sendMessage("⚠️ Please specify a valid UID to revoke access.", threadID, messageID);
                }
                if (!quizDb.unlimited.includes(targetUID)) {
                    return api.sendMessage(`⚠️ UID ${targetUID} is not found in the unlimited list.`, threadID, messageID);
                }
                quizDb.unlimited = quizDb.unlimited.filter(id => id !== targetUID);
                fs.writeJsonSync(dbPath, quizDb);
                return api.sendMessage(`✅ Successfully revoked unlimited access from UID: ${targetUID}`, threadID, messageID);
            }

            return api.sendMessage("⚠️ Invalid operations parameter. Use 'add', 'remove', or 'list'.", threadID, messageID);
        }

        // 2. Top Solvers Dashboard (Leaderboard)
        if (input === "top") {
            try {
                const allUsers = await usersData.getAll();
                const quizPlayers = allUsers
                    .filter(u => u.data && u.data.quiz && u.data.quiz.correct > 0)
                    .sort((a, b) => b.data.quiz.correct - a.data.quiz.correct)
                    .slice(0, 10);

                if (quizPlayers.length === 0) {
                    return api.sendMessage("🏆 ─── TOP QUIZ SOLVERS ─── 🏆\n\nNo records found in the mainframe database yet. Be the first to solve!", threadID, messageID);
                }

                let lbMsg = "🏆 ─── TOP QUIZ SOLVERS ─── 🏆\n──────────────────────────────\n";
                for (let i = 0; i < quizPlayers.length; i++) {
                    const name = quizPlayers[i].name || "Unknown User";
                    const correct = quizPlayers[i].data.quiz.correct;
                    const total = quizPlayers[i].data.quiz.total;
                    lbMsg += `[#0${i + 1}] 👤 ${name}\n» Solved: ${correct}/${total} Nodes\n──────────────────────────────\n`;
                }
                return api.sendMessage(lbMsg, threadID, messageID);
            } catch (err) {
                console.error(err);
                return api.sendMessage("❌ Failed to pull top system configurations from the database.", threadID, messageID);
            }
        }

        // 3. Active Category List Dashboard
        if (input === "list") {
            const catalogMsg = "🌐 ─── QUIZ CATEGORY INDEX ─── 🌐\n──────────────────────────────\n" +
                               "⚡ [01] Random\n" +
                               "🎨 [02] Anime\n" +
                               "🔢 [03] Math\n" +
                               "💻 [04] ICT\n" +
                               "🔤 [05] English_quiz\n" +
                               "🇧🇩 [06] Bangla_quiz\n" +
                               "🗺️ [07] Geography\n" +
                               "📜 [08] History\n" +
                               "🕌 [09] Islamic\n" +
                               "──────────────────────────────\n" +
                               "💡 Usage: '{p}quiz [category_name]'\n🔄 All nodes are synced with the live API.";
            return api.sendMessage(catalogMsg, threadID, messageID);
        }

        const validCategories = ["Random", "anime", "math", "ict", "English_quiz", "Bangla_quiz", "geography", "history", "Islamic"];
        let category = args[0] || "Random";
        
        const matchedCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
        if (!matchedCategory) {
            return api.sendMessage(`⚠️ Invalid category selection!\n\nUse:\n• {p}quiz list (To view categories)\n• {p}quiz top (To view rankings)`, threadID, messageID);
        }

        // 4. Checking Rate Limits (Unlimited Users and Owners skip this)
        const isOwner = CONFIG.owners.includes(senderID);
        const isUnlimited = quizDb.unlimited.includes(senderID) || isOwner;

        if (!isUnlimited) {
            const playerLimit = quizDb.players[senderID] || { count: 0, startTime: Date.now() };
            const now = Date.now();
            const cooldownWindow = 12 * 60 * 60 * 1000; 

            if (now - playerLimit.startTime > cooldownWindow) {
                playerLimit.count = 0;
                playerLimit.startTime = now;
            }

            if (playerLimit.count >= 30) {
                const timeRemaining = (playerLimit.startTime + cooldownWindow) - now;
                const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutesLeft = Math.ceil((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                return api.sendMessage(`🛑 Access Denied! You reached your 30 sessions limit for this cycle.\nRe-authorization in: ${hoursLeft}h ${minutesLeft}m`, threadID, messageID);
            }

            // Increment count & save changes
            playerLimit.count += 1;
            quizDb.players[senderID] = playerLimit;
            fs.writeJsonSync(dbPath, quizDb);
        }

        // 5. Main API Engine Fetch
        try {
            const response = await axios.get(`https://waguri-chan-quiz-api-production.up.railway.app/api/quiz/get?category=${matchedCategory}&limit=1`);
            
            if (!response.data || !response.data.success || !response.data.data.length) {
                return api.sendMessage("❌ System Error: Failed to extract quiz node.", threadID, messageID);
            }

            const quiz = response.data.data[0];
            const question = quiz.question;
            const options = quiz.options;
            const correctAnswer = quiz.correctAnswer;
            const quizCategory = quiz.category;

            const letterMap = ["A", "B", "C", "D"];
            let optionString = "";
            let correctLetter = "";

            options.forEach((opt, index) => {
                optionString += `  [ ${letterMap[index]} ] ➔ ${opt}\n`;
                if (opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
                    correctLetter = letterMap[index];
                }
            });

            const msg = `⚡ ─── QUIZ INTERFACE [${quizCategory.toUpperCase()}] ─── ⚡\n──────────────────────────────\n\n` +
                        `📝 QUESTION:\n${question}\n\n` +
                        `📋 OPTIONS:\n${optionString}\n` +
                        `──────────────────────────────\n` +
                        `👉 Reply with the correct letter (A, B, C, D) to submit your solution!\n` +
                        `⏰ Timer: You have 120 seconds to execute.`;

            api.sendMessage(msg, threadID, (err, info) => {
                if (err) return;

                // 120 Seconds Timeout Logic
                const timeoutID = setTimeout(async () => {
                    const activeReply = global.GoatBot.onReply.get(info.messageID);
                    if (activeReply) {
                        api.unsendMessage(info.messageID);
                        global.GoatBot.onReply.delete(info.messageID);

                        try {
                            const userData = await usersData.get(senderID);
                            if (!userData.data) userData.data = {};
                            userData.money = Math.max(0, (userData.money || 0) - 12000);
                            await usersData.set(senderID, userData);

                            let currentLimitMsg = "Unlimited";
                            if (fs.existsSync(dbPath)) {
                                const tempDb = fs.readJsonSync(dbPath);
                                if (!isUnlimited && tempDb.players[senderID]) {
                                    currentLimitMsg = `${tempDb.players[senderID].count}/30`;
                                }
                            }

                            api.sendMessage(`⏰ ─── TIMEOUT EXPIRED ─── ⏰\n──────────────────────────────\n❌ Player: @${userData.name || "User"}\n⚠️ Status: Failed to answer within 120s.\n💸 Penalty: -12,000 coins deducted.\n📊 Quiz Limit: [ ${currentLimitMsg} ]\n──────────────────────────────`, threadID);
                        } catch (dbErr) {
                            api.sendMessage(`⏰ ─── TIMEOUT EXPIRED ─── ⏰\n──────────────────────────────\n❌ Time limit exceeded! Answer session closed.`, threadID);
                        }
                    }
                }, 120000);

                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    messageID: info.messageID,
                    authorID: event.senderID,
                    correctAnswer: correctAnswer,
                    correctLetter: correctLetter,
                    options: options,
                    timeoutID: timeoutID 
                });
            });

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Mainframe API Communication failure. Check link status.", threadID, messageID);
        }
    },

    onReply: async function (context) {
        const api = context.api;
        const event = context.event;
        const Reply = context.Reply;
        const usersData = context.usersData;

        const senderID = event.senderID;
        const body = event.body;
        const threadID = event.threadID;
        const messageID = event.messageID;

        if (senderID !== Reply.authorID) return; 

        // Anti-Author Modification Guard
        if (this.config.author !== "Sa'Jibx7") {
            return api.sendMessage("❌ [SECURITY ALERT] Core configuration modified. Access Denied.", threadID, messageID);
        }

        // Cancel the 120-second timeout
        if (Reply.timeoutID) {
            clearTimeout(Reply.timeoutID);
        }

        // Unsend the original quiz question message
        api.unsendMessage(Reply.messageID);

        const userAnswer = body.trim().toLowerCase();
        const correctAnswer = Reply.correctAnswer;
        const correctLetter = Reply.correctLetter;
        const options = Reply.options;

        const letterMap = ["a", "b", "c", "d"];
        let isCorrect = false;

        if (userAnswer === correctLetter.toLowerCase() || userAnswer === correctAnswer.toLowerCase()) {
            isCorrect = true;
        } else {
            const selectedIndex = letterMap.indexOf(userAnswer);
            if (selectedIndex !== -1 && options[selectedIndex] && options[selectedIndex].toLowerCase() === correctAnswer.toLowerCase()) {
                isCorrect = true;
            }
        }

        // Database Update & Economy Execution
        try {
            const userData = await usersData.get(senderID);
            if (!userData.data) userData.data = {};
            if (!userData.data.quiz) userData.data.quiz = { correct: 0, total: 0 };

            userData.data.quiz.total += 1;

            // Retrieve current quiz limit count
            const dbPath = path.join(process.cwd(), "tmp", "quiz_db.json");
            let limitDisplay = "Unlimited";
            if (fs.existsSync(dbPath)) {
                try {
                    const tempDb = fs.readJsonSync(dbPath);
                    const isOwner = CONFIG.owners.includes(senderID);
                    const isUnlimited = tempDb.unlimited.includes(senderID) || isOwner;
                    if (!isUnlimited && tempDb.players[senderID]) {
                        limitDisplay = `${tempDb.players[senderID].count}/30`;
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            if (isCorrect) {
                userData.money = (userData.money || 0) + 20000;
                userData.data.quiz.correct += 1;

                let expGained = 5000; // Base 5,000 EXP on correct answer
                let hasMilestoneReward = false;

                // Grant extra 20,000 EXP milestone reward on every multiple of 30 correct wins
                if (userData.data.quiz.correct > 0 && userData.data.quiz.correct % 30 === 0) {
                    expGained += 20000;
                    hasMilestoneReward = true;
                }

                userData.exp = (userData.exp || 0) + expGained;
                await usersData.set(senderID, userData);

                let successMsg = `✨ ─── SUCCESSFUL INJECTION ─── ✨\n──────────────────────────────\n` +
                                   `✅ Status: Correct Answer!\n` +
                                   `🎯 Solution: ${correctAnswer} [${correctLetter}]\n\n` +
                                   `💰 System Balance: +20,000 coins added to account.\n` +
                                   `⭐ Experience: +5,000 EXP injected successfully.\n`;

                if (hasMilestoneReward) {
                    successMsg += `🎁 Milestone Reward: +20,000 bonus EXP injected for achieving ${userData.data.quiz.correct} total wins!\n`;
                }

                successMsg += `📊 Quiz Limit: [ ${limitDisplay} ]\n──────────────────────────────`;
                api.sendMessage(successMsg, threadID, messageID);
            } else {
                userData.money = Math.max(0, (userData.money || 0) - 10000);
                await usersData.set(senderID, userData);

                const failMsg = `❌ ─── SYSTEM PURGE ERROR ─── ❌\n──────────────────────────────\n` +
                                `⚠️ Status: Incorrect Answer!\n` +
                                `🎯 Correct Node: ${correctAnswer} [${correctLetter}]\n\n` +
                                `💸 System Penalty: -10,000 coins deducted from account.\n` +
                                `📊 Quiz Limit: [ ${limitDisplay} ]\n──────────────────────────────`;
                api.sendMessage(failMsg, threadID, messageID);
            }
        } catch (dbError) {
            console.error(dbError);
            if (isCorrect) {
                api.sendMessage(`✅ Correct Answer! Target mapped: ${correctAnswer} (${correctLetter})`, threadID, messageID);
            } else {
                api.sendMessage(`❌ Incorrect Answer! Targeted node sequence: ${correctAnswer} (${correctLetter})`, threadID, messageID);
            }
        }

        global.GoatBot.onReply.delete(Reply.messageID);
    }
};
