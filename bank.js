module.exports = {
  config: {
    name: "bank",
    version: "2.1",
    author: "Huraira Sajib",
    role: 0,
    category: "economy",
    guide: {
      en:
        "bank create\n" +
        "bank bal\n" +
        "bank deposit <amount>\n" +
        "bank withdraw <amount>\n" +
        "bank loan <amount>\n" +
        "bank payloan <amount>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const uid = event.senderID;
    const sub = args[0]?.toLowerCase();
    const now = Date.now();

    // ===== FORMAT NUMBER (K M B T) =====
    const fmt = (n) => {
      if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
      if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
      if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
      return String(n);
    };

    let user = await usersData.get(uid);
    if (!user.data) user.data = {};

    // ===== INIT BANK DATA =====
    if (!user.data.bank) {
      user.data.bank = {
        created: false,
        balance: 0,
        loan: 0,
        lastInterest: now
      };
    }

    const bank = user.data.bank;

    // ===== MONTHLY INTEREST (10%) =====
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    if (bank.created && bank.balance > 0 && now - bank.lastInterest >= monthMs) {
      const months = Math.floor((now - bank.lastInterest) / monthMs);
      const interest = Math.floor(bank.balance * 0.10 * months);
      bank.balance += interest;
      bank.lastInterest += months * monthMs;
      await usersData.set(uid, user);
    }

    // ===== CREATE =====
    if (sub === "create") {
      if (bank.created)
        return api.sendMessage(
          "🏦 | You already have a bank account.",
          event.threadID
        );

      bank.created = true;
      await usersData.set(uid, user);

      return api.sendMessage(
        "✅ | Bank account created successfully 🏦",
        event.threadID
      );
    }

    // ===== CHECK =====
    if (!bank.created) {
      return api.sendMessage(
        "❌ You don't have a bank account.\nUse: bank create",
        event.threadID
      );
    }

    // ===== BALANCE / STATUS =====
    if (sub === "bal" || !sub) {
      const cash = user.money || 0;
      const bankBal = bank.balance || 0;
      const loan = bank.loan || 0;
      const net = cash + bankBal - loan;

      const msg = `
╔════════════════════╗
   💎 𝐁𝐀𝐍𝐊 𝐒𝐓𝐀𝐓𝐔𝐒 💎
╚════════════════════╝

💸 𝐂𝐚𝐬𝐡      : ${fmt(cash)}
🏦 𝐁𝐚𝐧𝐤      : ${fmt(bankBal)}
💳 𝐋𝐨𝐚𝐧      : ${fmt(loan)}
📊 𝐍𝐞𝐭 𝐖𝐨𝐫𝐭𝐡 : ${fmt(net)}

✨ 𝐒𝐭𝐚𝐭𝐮𝐬 : 𝐀𝐂𝐓𝐈𝐕𝐄
`;

      return api.sendMessage(msg, event.threadID);
    }

    // ===== DEPOSIT =====
    if (sub === "deposit") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0)
        return api.sendMessage("❌ Invalid amount.", event.threadID);
      if ((user.money || 0) < amt)
        return api.sendMessage("❌ Not enough cash.", event.threadID);

      user.money -= amt;
      bank.balance += amt;

      await usersData.set(uid, user);
      return api.sendMessage(
        `✅ Deposited ${fmt(amt)} to bank.`,
        event.threadID
      );
    }

    // ===== WITHDRAW =====
    if (sub === "withdraw") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0)
        return api.sendMessage("❌ Invalid amount.", event.threadID);
      if (bank.balance < amt)
        return api.sendMessage("❌ Not enough bank balance.", event.threadID);

      bank.balance -= amt;
      user.money = (user.money || 0) + amt;

      await usersData.set(uid, user);
      return api.sendMessage(
        `✅ Withdrawn ${fmt(amt)} from bank.`,
        event.threadID
      );
    }

    // ===== LOAN =====
    if (sub === "loan") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0)
        return api.sendMessage("❌ Invalid amount.", event.threadID);

      const limit = 500_000_000;
      if (bank.loan + amt > limit)
        return api.sendMessage("❌ Loan limit is 500M.", event.threadID);

      bank.loan += amt;
      user.money = (user.money || 0) + amt;

      await usersData.set(uid, user);
      return api.sendMessage(
        `💳 Loan approved: ${fmt(amt)}`,
        event.threadID
      );
    }

    // ===== PAY LOAN =====
    if (sub === "payloan") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0)
        return api.sendMessage("❌ Invalid amount.", event.threadID);
      if ((user.money || 0) < amt)
        return api.sendMessage("❌ Not enough cash.", event.threadID);
      if (bank.loan <= 0)
        return api.sendMessage("❌ You have no loan.", event.threadID);

      const pay = Math.min(amt, bank.loan);
      bank.loan -= pay;
      user.money -= pay;

      await usersData.set(uid, user);
      return api.sendMessage(
        `✅ Loan paid: ${fmt(pay)}`,
        event.threadID
      );
    }
  }
};