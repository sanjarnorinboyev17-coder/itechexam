require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const users = {};

bot.onText(/\/start/, (msg) => {
    const id = msg.from.id;

    users[id] = {
        step: "firstName",
        submitted: false
    };

    bot.sendMessage(id, "Ismingizni kiriting:");
});

bot.on("message", async (msg) => {

    const id = msg.from.id;
    const user = users[id];

    if (!user) return;

    // /start ni qayta ishlamaslik
    if (msg.text === "/start") return;

    // =========================
    // 📱 TELEFON BOSQICHI
    // =========================
    if (user.step === "phone") {

        if (!msg.contact) {
            return bot.sendMessage(id, "❗ Pastdagi tugma orqali yuboring.");
        }

        user.phone = msg.contact.phone_number;
        user.step = "submit";

        return bot.sendMessage(
            id,
            "Endi javobingizni yuboring (1 marta).",
            { reply_markup: { remove_keyboard: true } }
        );
    }

    // =========================
    // 👤 ISM
    // =========================
    if (user.step === "firstName" && msg.text) {
        user.firstName = msg.text;
        user.step = "lastName";
        return bot.sendMessage(id, "Familiyangizni kiriting:");
    }

    // =========================
    // 👤 FAMILIYA
    // =========================
    if (user.step === "lastName" && msg.text) {
        user.lastName = msg.text;
        user.step = "group";
        return bot.sendMessage(id, "Guruhingizni kiriting:");
    }

    // =========================
    // 🏫 GURUH
    // =========================
    if (user.step === "group" && msg.text) {

        user.group = msg.text;
        user.step = "phone";

        const keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: "📱 Raqam yuborish", request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };

        return bot.sendMessage(id, "Telefon raqamingizni yuboring:", keyboard);
    }

    // =========================
    // 📩 SUBMIT
    // =========================
    if (user.step === "submit") {

        if (user.submitted) {
            return bot.sendMessage(id, "❌ Siz allaqachon topshirgansiz.");
        }

        user.submitted = true;

        const info = `
📌 Yangi topshiriq

👤 ${user.firstName} ${user.lastName}
🏫 ${user.group}
📱 ${user.phone}
🆔 ${id}
`;

        await bot.sendMessage(process.env.GROUP_ID, info);

        if (msg.text) {
            await bot.sendMessage(process.env.GROUP_ID, msg.text);
        }

        if (msg.photo) {
            await bot.sendPhoto(process.env.GROUP_ID, msg.photo[msg.photo.length - 1].file_id);
        }

        if (msg.video) {
            await bot.sendVideo(process.env.GROUP_ID, msg.video.file_id);
        }

        if (msg.document) {
            await bot.sendDocument(process.env.GROUP_ID, msg.document.file_id);
        }

        return bot.sendMessage(id, "✅ Javob qabul qilindi.");
    }

});