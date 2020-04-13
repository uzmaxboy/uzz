const ADMINS = [123456789, 987654321] // ID админов бота
const DB_URL = 'mongodb://localhost:27017/bogatiry' // URL базы бота
const QIWI_TOKEN = "dfgfdgfdgdfgdfhfghfghfg344bb" // API ключ QIWI кошелька с полным доступом
const BOT_TOKEN = "1096541213:AAFWc1qw5beCJ0e8RXGe7r7HVekQzlAV9TU" // Bot API Token

/*

Установка и поддержка скрипта: @Inffix

*/

var txnId = require('./txnId');

process.env.TZ = 'Moscow/Europe';
let trees = [
	{
		id: 1,
		name: "🐯 Элесей Силович",
		earn: 95,
		price: 25
	},
	{
		id: 2,
		name: "🐯 Соловей Разбойник",
		earn: 209,
		price: 250
	},
	{
		id: 3,
		name: "🐯 Алёша Попович",
		earn: 422,
		price: 500
	},
	{
		id: 4,
		name: "🐯 Добриня Никитич",
		earn: 903,
		price: 1000
	},
	{
		id: 5,
		name: "🐯 Илья Муромец",
		earn: 2090,
		price: 2500
	},
];

const mongo = require('mongoose');
mongo.connect(DB_URL);

var User = mongo.model('User', {
	id: Number,
	buybalance: Number,
	outbalance: Number,
	name: String,
	bhivebalance: Number,
	fc: Number,
	ref: Number,
	regDate: String,
	trees: Array,
	deposit: Number,
	payout: Number,
	fetuses: Number,
	menu: String,
	lastCollect: Number,
	ban: Boolean,
	refCount: Number,
	wb_profits: Number,
	not: Boolean
});

var wbProfits = [0, 33, 340, 618, 982, 2200, 4978, 7470, 23027]
var wbPrices = [0, 0, 120, 400, 500, 2000, 3000, 4000, 7000]

var Task = mongo.model('Task', {
	id: Number
});

const Ticket = mongo.model('Ticket', {
	id: Number,
	amount: Number,
	wallet: Number
})

const BeeMother = mongo.model("BeeMothr", {
	creator_id: Number,
	end_time: Number,
	beesGet: Number,
	nextBeeGet: Number
})

const WildBee = mongo.model("WildBee", {
	creator_id: Number,
	start_time: Number,
	level: Number,
	bee_profit: Number,
})

const Start = [
	["⚔️ Казарма", "⚰️ Кладбище"],
	["🖥 Личный кабинет", "👥 Партнёры"],
	["📢 Рекламодателям", "📚 О боте"]
];

const Cancel = [
	["🚫 Отмена"]
];

const AdminPanel = [
	["📬 Рассылка", "📮 Выплаты"],
	["📧 Информация"],
	["🔙 Назад"]
];

const RM_admin = {
	inline_keyboard: [
		[{ text: "✉️ Рассылка", callback_data: "admin_mm" }],
		[{ text: "🔎 Управление пользователем", callback_data: "admin_u" }],
		[{ text: "📮 Выплаты", callback_data: "admin_w" }],
		[{ text: "✏️ Бонус к пополнению", callback_data: "admin_b" }],
		[{ text: "⚜️ Ратуша", callback_data: "admin_bm" }],
		[{ text: "🕒 Топ за 24 часа", callback_data: "admin_top" }],
	]
}

const RM_admin_return = { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_return" }],] }

const RM_mm1 = {
	inline_keyboard: [
		[{ text: "⏹ Стоп", callback_data: "admin_mm_stop" }],
		[{ text: "⏸ Пауза", callback_data: "admin_mm_pause" }],
	]
}

const RM_mm2 = {
	inline_keyboard: [
		[{ text: "⏹ Стоп", callback_data: "admin_mm_stop" }],
		[{ text: "▶️ Продолжить", callback_data: "admin_mm_play" }],
	]
}



const { Qiwi } = require('node-qiwi-api');
const qiwi = new Qiwi(QIWI_TOKEN);

const Telegram = require('node-telegram-bot-api');
const bot = new Telegram(BOT_TOKEN, { polling: true });

bot.getMe().then(r => console.log(r))

bot.on('text', async (message) => {
	message.send = (text, params) => bot.sendMessage(message.chat.id, text, params);
	let $menu = [];
	var uid = message.from.id
	var text = message.text
	let dt = new Date
	console.log("[" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "] Пользователь " + uid + " отправил: " + text)

	Start.map((x) => $menu.push(x));
	if (ADMINS.find((x) => x == message.from.id)) $menu.push(["🔝 Админка"]);

	if (message.text) {
		if (message.text.startsWith('/start') || message.text == '🔙 Назад') {
			let $user = await User.findOne({ id: message.from.id });
			if (!$user) {
				let schema = {
					id: message.from.id,
					buybalance: 0,
					outbalance: 0,
					bhivebalance: 0,
					wb_profits: 0,
					name: message.from.first_name,
					fc: 0,
					ref: 0,
					regDate: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
					trees: [],
					deposit: 0,
					payout: 0,
					fetuses: 0,
					menu: "",
					lastCollect: Date.now(),
					ban: false,
					refCount: 0,
					not: false
				}

				let reffer = Number(message.text.split('/start ')[1]);

				if (reffer) {
					let $reffer = await User.findOne({ id: reffer });
					if ($reffer) {
						schema.ref = $reffer.id;
						await $reffer.inc('buybalance', 0.25);
						await $reffer.inc('refCount', 1);
						bot.sendMessage($reffer.id, `🔔 Вы пригласили <a href="tg://user?id=${message.from.id}">партнёра</a> и получили 0.25₽`, { parse_mode: "HTML" });
					}
				}

				let user = new User(schema);
				await user.save();
			}

			return message.send(`
✌️ <b>Привет, ${message.from.first_name}</b>
📝 <b>Цель игры:</b>
├─Пополняем счет 🤘
├─Покупаем богатырей ⚔️
├─Собираем доход 💸
├─Обмениваем доход 💵
└─Получаем деньги 💹
❓ Чем мы выплачиваем?
❗️ С пополнений в бота, с продажи рекламы,с енашего другого бота @TGZEMO_BOT
🏝 <b>Чат</b> 👉 @Bogatiry_chat
💳 <b>Выплаты</b> 👉 @Bogatiry_viplatu
📢 <b>Новости</b> 👉 @Bogatiry_news`, {
				parse_mode: "HTML",
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	message.user = await User.findOne({ id: message.from.id });
	if (!message.user) return message.send(`Что-то пошло не так... Напишите /start`);
	if (message.user.ban) return
	if (!message.user.name || message.user.name != message.from.first_name)
		await User.findOneAndUpdate({ id: message.from.id }, { name: message.from.first_name })

	if (state[uid] == 7770 && ADMINS.indexOf(message.from.id) !== -1 && text != "0") {
		state[uid] = undefined
		bot.sendMessage(uid, "Рассылка запущена!").then((e) => {
			if (text.split("#").length == 4) {
				var btn_text = text.split("#")[1].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
				var btn_link = text.split("#")[2].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
				text = text.split("#")[0]
				mm_t(text, e.message_id, e.chat.id, true, btn_text, btn_link, 100)
			}
			else mm_t(text, e.message_id, e.chat.id, false, false, false, 100)
		})
	}

	if (state[uid] == 77771 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		var bm = JSON.parse((await User.findOne({ id: 1 })).menu)
		bm.count = Number(text)
		bm.bought = 0
		bm.status = true
		await User.findOneAndUpdate({ id: 1 }, { menu: JSON.stringify(bm) })
		return message.send(`${text} ратуш выпущено на продажу по цене ${bm.price}!`, { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_bm" }]] } });
	}
	if (state[uid] == 77772 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		var bm = JSON.parse((await User.findOne({ id: 1 })).menu)
		bm.price = Number(text)
		await User.findOneAndUpdate({ id: 1 }, { menu: JSON.stringify(bm) })
		return message.send(`Стоимость ратуши установлена в ${bm.price} WAVES!`, { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_bm" }]] } });
	}
	if (state[uid] == 77773 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		var bm = JSON.parse((await User.findOne({ id: 1 })).menu)
		bm.count = Number(text)
		await User.findOneAndUpdate({ id: 1 }, { menu: JSON.stringify(bm) })
		return message.send(`Количество доступных ратуш установлено в ${bm.count} штук!`, { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_bm" }]] } });
	}

	if (state[uid] == 7771 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		text = Number(text.replace("%", ""))
		await User.findOneAndUpdate({ id: 0 }, { deposit: text })
		return message.send(`Бонус к пополнению в ${text}% установлен!`, { reply_markup: RM_admin_return });
	}

	if (state[uid] == 7772 && ADMINS.indexOf(message.from.id) !== -1 && text != "0") {
		state[uid] = undefined

		message.text = Number(message.text);
		let user = await User.findOne({ id: message.text });
		let u = user
		if (!user) return message.send('Пользователь не найден');

		let partners = await User.find({ ref: message.text });
		await message.user.set('menu', '');
		var kb = { inline_keyboard: [] }
		if (u.ban) kb.inline_keyboard.push([{ text: "♻️ Разбанить", callback_data: "unban_" + u.id }])
		else kb.inline_keyboard.push([{ text: "🛑 Забанить", callback_data: "ban_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Баланс покупок", callback_data: "addBuyBal_" + u.id }, { text: "✏️ Баланс покупок", callback_data: "editBuyBal_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Баланс вывода", callback_data: "addOutBal_" + u.id }, { text: "✏️ Баланс вывода", callback_data: "editOutBal_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Баланс WAVES", callback_data: "addBHIVEBal_" + u.id }, { text: "✏️ Баланс WAVES", callback_data: "editBHIVEBal_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Пополнения", callback_data: "addPayIns_" + u.id }, { text: "✏️ Пополнения", callback_data: "editPayIns_" + u.id }])

		kb.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "admin_return" }])

		return message.send(`📝 Пригласил: <b>${partners.length}</b>

🆔 ID: <code>${user.id}</code>

💰 Баланс:
🛒 Для покупок: ${user.buybalance.toFixed(2)}₽
📭 Для вывода: ${user.outbalance.toFixed(2)}₽
💰 BHIVE: ${user.bhivebalance.toFixed(2)}

🐯 Богатырей в казарме: <b>${user.trees.length}</b>

<b>Пополнил: ${roundPlus(user.deposit)}₽</b>
<b>Вывел: ${roundPlus(user.payout)}₽</b>
`, {
			parse_mode: "HTML",
			reply_markup: kb
		});

	}

	if (state[uid] == 7773 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { $inc: { buybalance: Number(text) } })
		bot.sendMessage(data[uid], `💰 Ваш баланс для покупок пополнен на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для покупок пользователя пополнен на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 7774 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { $inc: { outbalance: Number(text) } })
		bot.sendMessage(data[uid], `💰 Ваш баланс для вывода пополнен на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для вывода пользователя пополнен на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 77745 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { $inc: { bhivebalance: Number(text) } })
		bot.sendMessage(data[uid], `💰 Ваш баланс криптовалюты WAVES пополнен на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`WAVES баланс пользователя пополнен на ${text} WAVES!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 777455 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { deposit: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш сумма Ваших пополнений пополнена на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Сумма пополнений пользователя пополнена на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 7775 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { buybalance: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш баланс для покупок изменён на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для покупок пользователя изменён на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 7776 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { outbalance: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш баланс для вывода изменён на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для вывода пользователя изменён на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 77765 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { bhivebalance: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш баланс криптовалюты WAVES изменён на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`WAVES Баланс пользователя изменён на ${text} WAVES!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 777655 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { deposit: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш сумма Ваших пополнений измена на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Сумма пополнений пользователя изменёна на ${text}₽!`, { reply_markup: RM_admin_return });
	}

	if (message.text) {
		if (message.text == '🚫 Отмена') {
			await message.user.set('menu', '');
			return message.send('🚫 Отменено.', {
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	if (message.user.menu == 'reinvest') {
		message.text = Number(message.text);

		if (!message.text) return message.send('Введите сумму для реинвестирования!');
		if (message.text <= 0) return message.send('Введите сумму для реинвестирования!');

		if (message.text > message.user.outbalance) return message.send('Недостаточно средств.');
		else if (message.text <= message.user.outbalance) {
			await message.user.set('menu', '');

			await message.user.dec('outbalance', message.text);
			await message.user.inc('buybalance', message.text);

			return message.send(`Вы успешно реинвестировали ${message.text.toFixed(2)}₽`, {
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	if (message.user.menu.startsWith('amountQiwi')) {
		message.text = Number(message.text);

		if (!message.text) return message.send('Введите сумму на вывод!');
		if (message.text <= 0) return message.send('Введите сумму на вывод!');

		if (message.text > message.user.outbalance) return message.send('Недостаточно средств.');
		if (message.text < 30) return message.send('Введите сумму более 30 рублей!');

		if (message.text <= message.user.outbalance) {
			await message.user.dec('outbalance', message.text);

			let ticket = new Ticket({
				id: message.from.id,
				amount: message.text,
				wallet: Number(message.user.menu.split('amountQiwi')[1])
			});

			await ticket.save();
			await message.user.set('menu', '');

			return message.send('Заявка на выплату создана, ожидайте.', {
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	if (message.user.menu == 'qiwi') {
		message.text = Number(message.text);

		if (!message.text) return message.send('Введите правильный номер!', {
			reply_markup: {
				keyboard: Cancel,
				resize_keyboard: true
			}
		});

		if (message.text < 70000000000) return message.send('Введите правильный номер!', {
			reply_markup: {
				keyboard: Cancel,
				resize_keyboard: true
			}
		});

		await message.user.set('menu', 'amountQiwi' + message.text);
		return message.send(`Введите сумму на вывод. Вы можете вывести ${message.user.outbalance.toFixed(2)}₽`);
	}

	if (message.text) {
		if (message.text == '⚔️ Казарма') {
			return message.send('Выберите, куда зайти.', {
				reply_markup: {
					inline_keyboard: [
						[{ text: "🛒 Магазин", callback_data: "store" }],
						[{ text: "⚔️ Моя казарма", callback_data: "trees:inv1" }],
					]
				}
			});
		}

		if (message.text == '⚰️ Кладбище') {
			return bot.sendPhoto(message.chat.id, "/home/bot/paid/Bogatiry/pic2.png", {
				caption: `На кладбище Вы сможете обменять <b>⚔️ убийства</b> на <b>₽ рубли</b>

1000 ⚔️ убийств = 1 рубль
Минимальная сумма обмена: 1000 убийств
					
⚔️ <b>Ваши убийства:</b> ${message.user.fetuses.toFixed(2)}
					
После обмена 50% попадает на баланс для покупок, а остальные 50% на баланс для вывода`, parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🔄 Обменять", callback_data: "exchange" }]
					]
				}
			})

		}

		if (message.text == '🖥 Личный кабинет') {
			return message.send(`📝 Имя: <b>${message.from.first_name.replace(/(\<|\>)/g, '')}</b>

🆔 <b>ID:</b> <code>${message.from.id}</code>

🛒 <b>На покупки:</b> ${message.user.buybalance.toFixed(2)}₽
📭 <b>На вывод:</b> ${message.user.outbalance.toFixed(2)}₽
💰 <b>Криптовалюта:</b> ${message.user.bhivebalance.toFixed(2)} WAVES

🐯 <b>Богатырей в казарме:</b> ${message.user.trees.length}

💸 <b>Пополнено:</b> ${message.user.deposit.toFixed(2)}₽
🤑 <b>Выведено:</b> ${message.user.payout.toFixed(2)}₽`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "📥 Пополнить", callback_data: "deposit" }, { text: "📤 Вывести", callback_data: "withdraw" }],
						[{ text: "♻️ Реинвест", callback_data: "reinvest" }, { text: "🐯 Моя казарма", callback_data: "trees:totalMy" }],
					]
				}
			});
		}

		if (message.text == '👥 Партнёры') {
			return message.send(`<b>🤝 Партнёрская программа:</b>
🔑 Вы получаете:
▫️ 0.25 💸 за каждого приглашенного партнёра
▫️ 10% с пополнений ваших партнёров:
	По 5% на балансы для покупок и для вывода
		   
🔗 Ваша ссылка для приглашений: https://t.me/bogatiry_investbot?start=${message.from.id}
		   
🎊 Вы уже пригласили: ${await User.countDocuments({ ref: message.from.id })}
		`, {
				parse_mode: "HTML"
			})
		}

		if (message.text == '📢 Рекламодателям') {
			return message.send(`📢 <b>Наш проект открыт к рекламным и партнёрским предложениям:</b>\n\n<b>Наши контакты:</b>\n▫️ @romkej\n▫️ @romkej_bot`, { parse_mode: "HTML", });
		}

		if (message.text == '📚 О боте') {

			var s = await User.findOne({ id: 0 })
			let stats = {
				users: await User.countDocuments(),
				users_today: await User.find({ regDate: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}` }),
				cmds: message.message_id
			}

			stats.users_today = stats.users_today.length;

			return message.send(`
📊<b> Статистика проекта:</b>\n
👨‍💻 Пользователей в игре: ${stats.users}
👨‍💻 Пользователей сегодня: ${stats.users_today}
📥 Инвестировано всего: ${Math.round(s.ref)}₽
📤 Выплачено всего: ${Math.round(s.fc)}₽
🕐 Старт бота произведен 20.11.2019
`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "👨‍💻 Администратор", url: "https://t.me/romkej" }],
						[{ text: "💬 Чат", url: "https://t.me/Bogatiry_chat" }],
						[{ text: "♻️ Пополения и выводы", url: "https://t.me/bogatiry_viplatu" }],
						[{ text: "⚔️ Новости проекта", url: "https://t.me/Bogatiry_news" }],
						[{ text: "🥇 Топ инвесторов", callback_data: "topInv" }, { text: "🏆 Топ рефоводов", callback_data: "topRef" }],
					]
				}
			});
		}
	}

	if (ADMINS.indexOf(message.from.id) !== -1) {
		if (message.text == '🔝 Админка') {
			var h = process.uptime() / 3600 ^ 0
			var m = (process.uptime() - h * 3600) / 60 ^ 0
			var s = process.uptime() - h * 3600 - m * 60 ^ 0
			var heap = process.memoryUsage().rss / 1048576 ^ 0
			var b = (await User.findOne({ id: 0 })).deposit
			return qiwi.getBalance(async (err, balance) => {
				bot.sendMessage(uid, '<b>Админ-панель:</b>\n\n<b>Аптайм бота:</b> ' + h + ' часов ' + m + ' минут ' + s + ' секунд\n<b>Пользователей в боте: </b>' + (await User.countDocuments({})) + '\n<b>Памяти использовано:</b> ' + heap + "МБ\n<b>Заявок на вывод:</b> " + await Ticket.countDocuments() + "\n<b>Баланс QIWI:</b> " + balance.accounts[0].balance.amount + "₽\n<b>Бонус к пополнению:</b> " + b + "%", { parse_mode: "HTML", reply_markup: RM_admin })
			})
		}

		if (message.text.startsWith('/setbuybalance')) {
			let cmd = message.text.split(' ');
			if (!cmd[1]) return message.send('Ошибка!');

			let user = await User.findOne({ id: Number(cmd[1]) });
			if (!user) return message.send('Пользователь не найден!');

			await user.set('buybalance', Number(cmd[2]));
			return message.send('Баланс установлен.');
		}

		if (message.text.startsWith('/setoutbalance')) {
			let cmd = message.text.split(' ');
			if (!cmd[1]) return message.send('Ошибка!');

			let user = await User.findOne({ id: Number(cmd[1]) });
			if (!user) return message.send('Пользователь не найден!');

			await user.set('outbalance', Number(cmd[2]));
			return message.send('Баланс установлен.');
		}

	}
});

bot.on('callback_query', async (query) => {
	const { message } = query;
	message.user = await User.findOne({ id: message.chat.id });
	var uid = message.chat.id
	let dt = new Date
	console.log("[" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "] Пользователь " + uid + " отправил колбэк: " + query.data)

	if (!message.user) return bot.answerCallbackQuery(query.id, 'Что-то пошло не так...', true);

	if (query.data == 'none') return bot.answerCallbackQuery(query.id, 'Привет! :)', true);

	if (query.data.startsWith('trees:shop')) {
		let id = Number(query.data.split('trees:shop')[1]);
		var maxId = 0
		message.user.trees.map((t) => { if (t.id > maxId) maxId = t.id })
		let tree = trees.find((x) => x.id == id);

		var treesWithEqualId = 0
		message.user.trees.map((t) => { if (t.id == id) treesWithEqualId++ })

		if (id <= maxId + 1) {
			if (treesWithEqualId < 5)
				var bbtn = [{ text: `➕ Купить за ${tree.price}₽`, callback_data: `trees:buy${tree.id}` }]
			else var bbtn = [{ text: `🛑 Вы достигли лимита в 5 богатырей`, callback_data: getNavigationQuery(id + 1, tree.id) }]

		}
		else
			var bbtn = [{ text: `◀️ Сперва купите предыдущего богатыря`, callback_data: getNavigationQuery(id - 1, tree.id) }]

		if (!tree) return bot.answerCallbackQuery(query.id, 'Что-то пошло не так...', true);

		bot.deleteMessage(message.chat.id, message.message_id)
		bot.sendPhoto(message.chat.id, `/home/bot/paid/Bogatiry/c${tree.id}.png`, {
			caption: `<b>${tree.name}</b>
		
💰 Стоимость: ${tree.price}₽
⚔️ Убийств в час: ${tree.earn}`, parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [[
					{ text: getInventoryIcon(1, tree.id), callback_data: getNavigationQuery(1, tree.id) },
					{ text: getInventoryIcon(2, tree.id), callback_data: getNavigationQuery(2, tree.id) },
					{ text: getInventoryIcon(3, tree.id), callback_data: getNavigationQuery(3, tree.id) },
					{ text: getInventoryIcon(4, tree.id), callback_data: getNavigationQuery(4, tree.id) },
					{ text: getInventoryIcon(5, tree.id), callback_data: getNavigationQuery(5, tree.id) },
				], bbtn
				]
			}
		})
	}

	if (query.data.startsWith('topInv')) {
		bot.deleteMessage(message.chat.id, message.message_id)
		var top = await User.find({ id: { $ne: 0, $ne: 1 } }).sort({ deposit: -1 }).limit(20)
		var c = 0
		return bot.sendMessage(uid, `<b>🥇 Топ 20 инвесторов:</b>\n\n${top.map((e) => { c++; return `<b>${c})</b> <a href="tg://user?id=${e.id}">${e.name ? e.name : "пользователь"}</a> - <b>${e.deposit}₽</b>` }).join("\n")}`, { parse_mode: "html" });
	}

	if (query.data.startsWith('topRef')) {
		bot.deleteMessage(message.chat.id, message.message_id)
		var top = await User.find({ id: { $ne: 0, $ne: 1 } }).sort({ refCount: -1 }).limit(20)
		var c = 0
		return bot.sendMessage(uid, `<b>🏆 Топ рефоводов:</b>\n\n${top.map((e) => { c++; return `<b>${c})</b> <a href="tg://user?id=${e.id}">${e.name ? e.name : "пользователь"}</a> - <b>${e.refCount}</b> рефералов` }).join("\n")}`, { parse_mode: "html" });
	}

	if (query.data.startsWith('store')) {
		bot.deleteMessage(message.chat.id, message.message_id)
		return bot.sendMessage(uid, 'Магазин:', {
			reply_markup: {
				inline_keyboard: [
					[{ text: "🐯 Богатыри", callback_data: "trees:shop1" }],
					[{ text: "🐲 Чемпионы", callback_data: "wildBees" }],
					[{ text: "⚜️ Ратуша", callback_data: "beeMother" }],
				]
			}
		});

	}

	if (query.data.startsWith('wildBees')) {
		bot.deleteMessage(message.chat.id, message.message_id)
		var reply_markup = { inline_keyboard: [] }
		var wb = await WildBee.find({ creator_id: uid })
		wb.map((b) => { reply_markup.inline_keyboard.push([{ text: `🐲 Чемпион ${b.level} уровня`, callback_data: "wb_" + b._id }]) })
		reply_markup.inline_keyboard.push([{ text: `➕ Собрать ${message.user.wb_profits} ⚔️`, callback_data: "wbCollect" }])
		reply_markup.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "store" }])
		return bot.sendMessage(uid, `🐲 Чемпионы могут появится только благодаря ратуше\n
<b>Для чемпионов доступно 5 уровней улучшения:</b>\n
Уровень | Убийств в час | Стоимость улучшения
1 уровень - 33 ⚔️ 
2 уровень - 340 ⚔️ - 120₽
3 уровень - 618 ⚔️ - 400₽
4 уровень - 982 ⚔️ - 500₽
5 уровень - 2200 ⚔️ - 2000₽
<b>Ваши чемпионы:</b>`, {
			reply_markup, parse_mode: "html"
		});
	}

	if (query.data.startsWith('wbCollect')) {
		if (message.user.wb_profits == 0)
			return bot.answerCallbackQuery(query.id, '🐲 Ваши чемпионы пока не принесли дохода!', true);
		else {
			bot.deleteMessage(message.chat.id, message.message_id)
			await User.findOneAndUpdate({ id: uid }, { wb_profits: 0 })
			await message.user.inc('fetuses', message.user.wb_profits)
			return bot.answerCallbackQuery(query.id, `🐲 Вы успешно собрали ${message.user.wb_profits} ⚔️`, true);
		}
	}

	if (query.data.startsWith('wbUpLevel_')) {
		var wb = await WildBee.findOne({ _id: query.data.split("_")[1] })
		var price = wbPrices[wb.level + 1]
		if (message.user.buybalance < price) return bot.answerCallbackQuery(query.id, `❌ На Вашем балансе для покупок недостаточно средств для улучшения`, true);
		await User.findOneAndUpdate({ id: uid }, { $inc: { buybalance: -price } })
		await WildBee.findOneAndUpdate({ _id: String(wb._id) }, { level: wb.level + 1 })
		bot.deleteMessage(message.chat.id, message.message_id)
		wb.level++
		var reply_markup = { inline_keyboard: [] }
		if (wb.level != 8)
			reply_markup.inline_keyboard.push([{ text: `🔼 Купить ${wb.level + 1} уровень за ${wbPrices[wb.level + 1]}₽`, callback_data: `wbUpLevel_` + wb._id }])
		reply_markup.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "wildBees" }])
		bot.sendPhoto(message.chat.id, "/home/bot/paid/MonetaFruit/pic3.png", {
			caption: `
🐲 <b>Чемпион ${wb.level} уровня</b> \n
🕒 <b>В казарме:</b> ${Math.floor((Date.now() - wb.start_time) / (1000 * 60 * 60 * 24))} дней
⚔️ <b>Убийств в час:</b> ${wbProfits[wb.level]}
💰 <b>Принёс убийств</b>: ${ wb.bee_profit}`, parse_mode: "HTML", reply_markup
		})
		return bot.answerCallbackQuery(query.id, `🔼 Уровень чемпиона повышен до ${wb.level} за ${price}₽`, true);

	}

	if (query.data.startsWith('wb')) {
		bot.deleteMessage(message.chat.id, message.message_id)
		var wb = await WildBee.findOne({ _id: query.data.split("_")[1] })
		var reply_markup = { inline_keyboard: [] }
		if (wb.level != 4)
			reply_markup.inline_keyboard.push([{ text: `🔼 Купить ${wb.level + 1} уровень за ${wbPrices[wb.level + 1]}₽`, callback_data: `wbUpLevel_` + wb._id }])
		reply_markup.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "wildBees" }])
		bot.sendPhoto(message.chat.id, "/home/bot/paid/MonetaFruit/pic3.png", {
			caption: `
🐲 <b>Чемпион ${wb.level} уровня</b> \n
🕒 <b>На пасеке:</b> ${Math.floor((Date.now() - wb.start_time) / (1000 * 60 * 60 * 24))} дней
⚔️ <b>Убийств в час:</b> ${wbProfits[wb.level]}
💰 <b>Принесла к</b>: ${ wb.bee_profit}`, parse_mode: "HTML", reply_markup
		})
	}

	if (query.data == ('beeMother')) {
		bot.deleteMessage(message.chat.id, message.message_id)
		console.log(await User.findOne({ id: 1 }))
		var bm = JSON.parse((await User.findOne({ id: 1 })).menu)
		var reply_markup = {
			inline_keyboard: [
			]
		}
		var ubm = await BeeMother.findOne({ creator_id: message.user.id })
		if (ubm != null) {
			var now = new Date()
			var ttl = Math.floor((ubm.end_time - now.getTime()) / (1000 * 60 * 60 * 24))
			var str = `<b>⚜️ Ваша ратуша:</b>\n
🕐 Осталось <b>${ttl}</b> дней
🐯 Принесла <b>${ubm.beesGet}</b> из <b>4</b> чемпионов
`
		}

		else if (!bm.status) var str = '<b>❌ Ратуша недоступна</b>'
		else {
			var str = `<b>✅ Ратуша доступна!</b>\n💸 Стоимость: <b>${bm.price} WAVES</b>\n🛒 Куплено <b>${bm.bought}</b> из <b>${bm.count}</b>`
			reply_markup.inline_keyboard.push([{ text: "🛒 Купить ратушу", callback_data: "beeMotherBuy" }])
		}
		reply_markup.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "store" }])
		return bot.sendMessage(uid, `
<b>⚜️ Покупка ратуши:</b>
❗️️️ Ратуша - магическое место, где рождаются чемпионы
💰 Её можно приобрести только за специальную валюту:
🏦 Ваш баланс криптовалюты: <b>${message.user.bhivebalance} WAVES</b>
⚜️ Ратуши появляется у исчезает с продажи когда угодно!
⚰️ Срок работы ратуши - 30 дней!
🐯 Ратуша за период своей жизни приносит 4 чемпиона!\n\n${str}`, {
			reply_markup, parse_mode: "html"
		});

	}

	if (query.data == ('beeMotherBuy')) {
		var bm = JSON.parse((await User.findOne({ id: 1 })).menu)

		if (!bm.status) return bot.answerCallbackQuery(query.id, '❌ Ратуша недоступна!', true);
		if (message.user.bhivebalance < bm.price) return bot.answerCallbackQuery(query.id, '❌ На Вашем балансе недостаточно криптовалюты WAVES!', true);
		bot.deleteMessage(message.chat.id, message.message_id)

		await User.findOneAndUpdate({ id: message.chat.id }, { $inc: { bhivebalance: -bm.price } })
		var now = new Date()
		now.setDate(now.getDate() + 7)
		var nextBeeGet = now.getTime()
		now.setDate(now.getDate() + 24)
		var end_time = now.getTime()
		await BeeMother.insertMany([{ creator_id: message.chat.id, beesGet: 0, nextBeeGet, end_time }])
		bm.bought++
		if (bm.bought >= bm.count) bm.status = false
		await User.findOneAndUpdate({ id: 1 }, { menu: JSON.stringify(bm) })
		return bot.sendMessage(uid, `
<b>⚜️ Вы успешно приобрели ратушу!</b>`, {
			reply_markup, parse_mode: "html"
		});

	}

	if (query.data.startsWith('trees:inv')) {
		let id = Number(query.data.split('trees:inv')[1]);

		let tree = trees.find((x) => x.id == id);
		if (!tree) return bot.answerCallbackQuery(query.id, 'Что-то пошло не так...', true);

		let total_balance = 0;

		message.user.trees.map((x) => {
			total_balance += (((Date.now() - message.user.lastCollect) / 1000) / 60) * (trees.find((a) => a.id == x.id).earn / 60);
		});

		let count = message.user.trees.filter((x) => x.id == tree.id).length;
		let earn = count * tree.earn;

		bot.deleteMessage(message.chat.id, message.message_id)
		bot.sendPhoto(message.chat.id, `/home/bot/paid/Bogatiry/c${tree.id}.png`, {
			caption: `<b>${tree.name}</b> (${count}x)
		
💰 Стоимость: ${tree.price}₽
⚔️ Убийств в час: ${earn}`, parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [[
					{ text: getInventoryIcon(1, tree.id), callback_data: getInventoryQuery(1, tree.id) },
					{ text: getInventoryIcon(2, tree.id), callback_data: getInventoryQuery(2, tree.id) },
					{ text: getInventoryIcon(3, tree.id), callback_data: getInventoryQuery(3, tree.id) },
					{ text: getInventoryIcon(4, tree.id), callback_data: getInventoryQuery(4, tree.id) },
					{ text: getInventoryIcon(5, tree.id), callback_data: getInventoryQuery(5, tree.id) },
				], [{ text: `➕ Собрать ${total_balance.toFixed(2)}⚔️`, callback_data: `trees:collect` }]
				]
			}
		})

	}

	if (query.data.startsWith('trees:buy')) {
		let total_balance = 0;

		message.user.trees.map((x) => {
			if ((((Date.now() - message.user.lastCollect) / 1000) / 60) * (trees.find((a) => a.id == x.id).earn / 60) > (trees.find((a) => a.id == x.id).earn * 72)) {
				total_balance += trees.find((a) => a.id == x.id).earn * 72;
			} else {
				total_balance += (((Date.now() - message.user.lastCollect) / 1000) / 60) * (trees.find((a) => a.id == x.id).earn / 60);
			}
		});


		let id = Number(query.data.split('trees:buy')[1]);

		let tree = trees.find((x) => x.id == id);
		if (!tree) return bot.answerCallbackQuery(query.id, 'Что-то пошло не так...', true);

		if (tree.price > message.user.buybalance) return bot.answerCallbackQuery(query.id, '🚫 Недостаточно денег для покупки.', true);
		else if (tree.price <= message.user.buybalance) {

			var treesWithEqualId = 0
			message.user.trees.map((t) => { if (t.id == id) treesWithEqualId++ })

			if (treesWithEqualId >= 5)
				return bot.answerCallbackQuery(query.id, `🛑 Вы достигли лимита в 5 богатырей данного уровня`, true);

			//await message.user.dec('buybalance', tree.price);

			await message.user.set('lastCollect', Date.now());
			await message.user.inc('fetuses', Number(total_balance.toFixed(2)));

			await message.user.trees.push({ id: tree.id, date: Date.now(), lastCollect: Date.now() });
			await message.user.save();
			await User.findOneAndUpdate({ id: uid }, { $inc: { buybalance: -tree.price } })


			return bot.answerCallbackQuery(query.id, `✅ Вы успешно приобрели ${tree.name} за ${tree.price}₽`, true);
		}
	}

	if (query.data == 'exchange') {
		if (message.user.fetuses < 1000) return bot.answerCallbackQuery(query.id, '🚫 Минимальная сумма обмена: 1000 ⚔️', true);
		let { fetuses } = message.user;
		await message.user.set('fetuses', 0);
		fetuses = fetuses / 1000;
		await message.user.inc('buybalance', fetuses / 2);
		await message.user.inc('outbalance', fetuses / 2);
		bot.deleteMessage(message.chat.id, message.message_id);
		return bot.answerCallbackQuery(query.id, `✅ Вы успешно обменяли ${(fetuses * 1000).toFixed(2)} ⚔️ на ${fetuses.toFixed(2)}₽`, true);
	}

	if (query.data == 'deposit') {
		bot.deleteMessage(message.chat.id, message.message_id);

		var b = (await User.findOne({ id: 0 })).deposit
		if (b == 0) var bt = ""
		else var bt = `\n<b>🔥 Временная акция: +${b}% при любом пополнении</b>`
		return bot.sendMessage(message.chat.id, `🥝 <b>Способ пополнения: QIWI</b>

🌐 Отправьте любую сумму на кошелек <code>+380633966429</code>
❗️ Не забудьте комментарий <code>B${message.chat.id}</code>

📥 <b>Для пополнения с помощью WAVES или других способов обращайтесь к администратору</b> @romkej
${bt}`, {
			parse_mode: "HTML"
		});
	}

	if (query.data == 'withdraw') {
		if (message.user.outbalance < 30) return bot.answerCallbackQuery(query.id, '🚫 Минимальная сумма вывода: 30₽', true);
		bot.deleteMessage(message.chat.id, message.message_id);

		await message.user.set('menu', 'qiwi');
		await bot.sendMessage(message.chat.id, 'Введите номер QIWI для вывода.\nНапример: 79001234567', {
			reply_markup: {
				keyboard: Cancel,
				resize_keyboard: true
			}
		});
	}

	if (query.data == 'reinvest') {
		await message.user.set('menu', 'reinvest');
		return bot.sendMessage(message.chat.id, 'Введите сумму, которую хотите реинвестировать.', {
			reply_markup: {
				keyboard: Cancel,
				resize_keyboard: true
			}
		});
	}

	if (query.data == 'trees:collect') {
		let total_balance = 0;

		message.user.trees.map((x) => {
			total_balance += (((Date.now() - message.user.lastCollect) / 1000) / 60) * (trees.find((a) => a.id == x.id).earn / 60);
		});

		await message.user.set('lastCollect', Date.now());

		await bot.deleteMessage(message.chat.id, message.message_id);
		await message.user.inc('fetuses', Number(total_balance.toFixed(2)));

		return bot.answerCallbackQuery(query.id, `Вы успешно собрали ${total_balance.toFixed(2)} ⚔️`, true);
	}

	if (query.data == 'trees:totalMy') {
		let $trees = [];
		let total_earn = 0;

		message.user.trees.map((x) => {
			$trees.push(x.id);
			total_earn += trees.find((a) => a.id == x.id).earn
		});

		let text = ``;

		if ($trees.filter((x) => x === 1).length) text += `\n\n<b>${trees.find((x) => x.id == 1).name}</b>\n\t\t▫️ Количество: ${$trees.filter((x) => x === 1).length}\n\t\t▪️ Убийств в час: ${$trees.filter((x) => x === 1).length * trees.find((x) => x.id == 1).earn}`;
		if ($trees.filter((x) => x === 2).length) text += `\n\n<b>${trees.find((x) => x.id == 2).name}</b>\n\t\t▫️ Количество: ${$trees.filter((x) => x === 2).length}\n\t\t▪️ Убийств в час: ${$trees.filter((x) => x === 2).length * trees.find((x) => x.id == 2).earn}`;
		if ($trees.filter((x) => x === 3).length) text += `\n\n<b>${trees.find((x) => x.id == 3).name}</b>\n\t\t▫️ Количество: ${$trees.filter((x) => x === 3).length}\n\t\t▪️ Убийств в час: ${$trees.filter((x) => x === 3).length * trees.find((x) => x.id == 3).earn}`;
		if ($trees.filter((x) => x === 4).length) text += `\n\n<b>${trees.find((x) => x.id == 4).name}</b>\n\t\t▫️ Количество: ${$trees.filter((x) => x === 4).length}\n\t\t▪️ Убийств в час: ${$trees.filter((x) => x === 4).length * trees.find((x) => x.id == 4).earn}`;
		if ($trees.filter((x) => x === 5).length) text += `\n\n<b>${trees.find((x) => x.id == 5).name}</b>\n\t\t▫️ Количество: ${$trees.filter((x) => x === 5).length}\n\t\t▪️ Убийств в час: ${$trees.filter((x) => x === 5).length * trees.find((x) => x.id == 5).earn}`;

		return bot.editMessageText(`📄 Список Ваших богатырей в казарме: ⤵️${text}\n\n════════════════════\n📊 Суммарный доход казарм в час: ${total_earn.toFixed(2)}⚔️`, {
			parse_mode: "HTML",
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}

	if (query.data == 'checkFollow') {
		let task = await Task.findOne({ id: message.chat.id });
		if (task) return bot.deleteMessage(message.chat.id, message.message_id);

		bot.getChatMember(-1001286701099, message.chat.id).then(async (res) => {
			if (res.status == 'left') return bot.answerCallbackQuery(query.id, '🚫 Вы не подписаны!');

			message.user.trees.push({
				id: 1,
				date: Date.now(),
				lastCollect: Date.now()
			});

			await message.user.save();

			let $task = new Task({
				id: message.chat.id
			});

			await $task.save();

			return bot.editMessageText('Вы выполнили задание и получили <b>Лимонное дерево</b>.', {
				parse_mode: "HTML",
				chat_id: message.chat.id,
				message_id: message.message_id
			});
		});
	}

	if (query.data.startsWith('withdraw:')) {
		let id = Number(query.data.split('withdraw:')[1]);
		let ticket = await Ticket.findOne({ id });

		if (!ticket) bot.deleteMessage(message.chat.id, message.message_id);
		bot.sendMessage("@bogatiry_viplatu", `⚔️ <a href="tg://user?id=${ticket.id}">Пользователь</a> вывел <b>${ticket.amount}₽</b>`, { parse_mode: "HTML" })
		qiwi.toWallet({ account: String(ticket.wallet), amount: ticket.amount, comment: 'Выплата от @bogatiry_investbot' }, () => { });
		bot.sendMessage(ticket.id, `Ваша выплата была одобрена, на QIWI зачислено ${ticket.amount}₽`);
		await User.findOneAndUpdate({ id: 0 }, { $inc: { fc: ticket.amount } })
		await User.findOneAndUpdate({ id: id }, { $inc: { payout: ticket.amount } })
		await ticket.remove();
		bot.editMessageText('Выплатил!', {
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}

	if (query.data.startsWith('back:')) {
		let id = Number(query.data.split('back:')[1]);
		let ticket = await Ticket.findOne({ id });

		if (!ticket) bot.deleteMessage(message.chat.id, message.message_id);

		let user = await User.findOne({ id: ticket.id });
		bot.sendMessage(ticket.id, `Ваша выплата была отклонена, на ваш счёт возвращено ${ticket.amount}₽`);

		await user.inc('buybalance', ticket.amount);
		await ticket.remove();

		return bot.editMessageText('Вернул!', {
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}

	if (query.data.startsWith('take:')) {
		let id = Number(query.data.split('take:')[1]);
		let ticket = await Ticket.findOne({ id });

		if (!ticket) bot.deleteMessage(message.chat.id, message.message_id);

		await ticket.remove();
		return bot.editMessageText('Забрал!', {
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}
	var d = query.data

	if (ADMINS.indexOf(query.from.id) !== -1) {
		if (d == "admin_mm") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите текст рассылки или отправьте изображение:\n\n<i>Для добавления кнопки-ссылки в рассылаемое сообщение добавьте в конец сообщения строку вида:</i>\n# Текст на кнопке # http://t.me/link #', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7770
		} else if (d == "admin_w") {
			bot.deleteMessage(message.chat.id, message.message_id);
			let tickets = await Ticket.find();
			if (tickets.length == 0) return bot.sendMessage(uid, 'Заявок на вывод нет');
			await tickets.map((x) => {
				bot.sendMessage(uid, `📝 Игрок: <a href="tg://user?id=${x.id}">Игрок</a> (ID: <code>${x.id}</code>)\n
	💰 Сумма: <code>${x.amount}</code>₽
	🥝 Кошелёк: <code>${x.wallet}</code>`, {
					parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: '📭 Подтвердить выплату', callback_data: `withdraw:${x.id}` }], [{ text: '♻️ Вернуть', callback_data: `back:${x.id}` }], [{ text: '🚫 Забрать', callback_data: `take:${x.id}` }]] }
				});
			});
		}
		else if (d.startsWith("admin_bm")) {
			bot.deleteMessage(message.chat.id, message.message_id);
			var bm = JSON.parse((await User.findOne({ id: 1 })).menu)
			if (d.split("_")[2] == "false") bm.status = false
			if (d.split("_")[2] == "true") bm.status = true
			await User.updateOne({ id: 1, menu: JSON.stringify(bm) })
			console.log(bm)
			bot.sendMessage(uid, `Настройки ратуши:\n
Стоимость: ${bm.price} WAVES
Статус: ${bm.status ? "✅ доступна для покупки" : "❌ недоступна для покупки"}
Доступно: ${bm.count}
Куплено: ${bm.bought}
`, {
				reply_markup: {
					inline_keyboard: [
						[{ text: 'Выпустить ратушу', callback_data: `Admin_bm_new` }],
						[{ text: 'Изменить стоимость', callback_data: `Admin_bm_price` }],
						[{ text: 'Изменить доступных', callback_data: `Admin_bm_count` }],
						[{ text: (bm.status ? 'Сделать непоступной' : "Сделать доступной"), callback_data: (bm.status ? 'admin_bm_false' : "admin_bm_true") }],
						[{ text: "◀️ Назад", callback_data: "admin_return" }],
					]
				}, parse_mode: "HTML"
			})
		}
		else if (d == "admin_top") {
			bot.deleteMessage(message.chat.id, message.message_id);
			var u = await User.find({ ref: { $ne: 0 }, _id: { $gt: mongo.Types.ObjectId.createFromTime(Date.now() / 1000 - 24 * 60 * 60) } })
			console.log(u)
			var top = []
			u.map((e) => {
				var t = top.filter(u => { if (e.ref == u.id) return true; else return false })
				if (t.length == 0) top.push({ id: e.ref, ref: 1 })
				else {
					top = top.filter(u => { if (e.ref == u.id) return false; else return true })
					top.push({ id: e.ref, ref: t[0].ref + 1 })
				}
			})
			top = top.sort((a, b) => { if (a.ref <= b.ref) return 1; else return -1 })
			top.length = 20
			var str = `<b>🕒 Топ инвесторов за 24 часа:</b>\n\n`
			for (const i in top) {
				var us = await User.findOne({ id: top[i].id })
				str += `<b>${Number(i) + 1})</b> <a href="tg://user?id=${us.id}">${us.name ? us.name : "Пользователь"}</a> - <b>${top[i].ref}</b> рефералов\n`
			}
			bot.sendMessage(uid, str, { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_return" }]] }, parse_mode: "HTML" })
		}
		else if (d == "Admin_bm_new") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите количество ратуш для продажи (число купивших обнулится, и ратуши станут автоматически доступны для покупки по текущей стоимости и пропадут с покупки, когда число купивших привысит доступное количество):', { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_bm" }]] }, parse_mode: "HTML" })
			state[uid] = 77771
		}
		else if (d == "Admin_bm_price") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новую стоимость ратуши в WAVES токенах:', { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_bm" }]] }, parse_mode: "HTML" })
			state[uid] = 77772
		}
		else if (d == "Admin_bm_count") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новое количество доступных ратуш:', { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_bm" }]] }, parse_mode: "HTML" })
			state[uid] = 77773
		}
		else if (d == "admin_b") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите % для бонуса к пополнению или 0 для отключения:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7771
		}
		else if (d == "admin_u") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите ID пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7772
		}
		else if (d.split("_")[0] == "addBuyBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму пополнения баланса для покупок пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7773
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "addOutBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму пополнения баланса для вывода пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7774
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "addBHIVEBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму пополнения WAVES баланса пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 77745
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "addPayIns") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму для добавления в сумму пополнений пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 777455
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editBuyBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новый баланс для покупок пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7775
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editOutBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новый баланс для вывода пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7776
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editBHIVEBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новый WAVES баланс пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 77765
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editPayIns") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новую сумму пополнений пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 777655
			data[uid] = d.split("_")[1]
		}
		else if (d == "admin_mm_stop") {
			var tek = Math.round((mm_i / mm_total) * 40)
			var str = ""
			for (var i = 0; i < tek; i++) str += "+"
			str += '>'
			for (var i = tek + 1; i < 41; i++) str += "-"
			mm_status = false;
			bot.editMessageText("Рассылка остановлена!", { chat_id: mm_achatid, message_id: mm_amsgid })
			mm_u = []
		}
		else if (d == "admin_mm_pause") {
			var tek = Math.round((mm_i / mm_total) * 40)
			var str = ""
			for (var i = 0; i < tek; i++) str += "+"
			str += '>'
			for (var i = tek + 1; i < 41; i++) str += "-"
			bot.editMessageText("<b>Выполнено:</b> " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n' + str + "\n\n<b>Статистика:</b>\n<b>Успешных:</b> " + mm_ok + "\n<b>Неуспешных:</b> " + mm_err, { chat_id: mm_achatid, message_id: mm_amsgid, reply_markup: RM_mm2, parse_mode: html })
			mm_status = false;
		}
		else if (d == "admin_mm_play") {
			mm_status = true;
			bot.editMessageText("Выполнено: " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n', { chat_id: mm_achatid, message_id: mm_amsgid, reply_markup: RM_mm1 })
		}
		else if (d.split("_")[0] == "ban") {
			var uuid = Number(d.split("_")[1])
			await User.findOneAndUpdate({ id: uuid }, { ban: true })
			bot.editMessageText('<a href="tg://user?id=' + uuid + '">Пользователь</a> заблокирован!', { chat_id: uid, message_id: message.message_id, parse_mode: html })
		}
		else if (d.split("_")[0] == "unban") {
			var uuid = Number(d.split("_")[1])
			await User.findOneAndUpdate({ id: uuid }, { ban: false })
			bot.editMessageText('<a href="tg://user?id=' + uuid + '">Пользователь</a> разбанен!', { chat_id: uid, message_id: message.message_id, parse_mode: html })
		}
		else if (d == "admin_return") {
			bot.deleteMessage(message.chat.id, message.message_id);
			var h = process.uptime() / 3600 ^ 0
			var m = (process.uptime() - h * 3600) / 60 ^ 0
			var s = process.uptime() - h * 3600 - m * 60 ^ 0
			var heap = process.memoryUsage().rss / 1048576 ^ 0
			var b = (await User.findOne({ id: 0 })).deposit
			return qiwi.getBalance(async (err, balance) => {
				bot.sendMessage(uid, '<b>Админ-панель:</b>\n\n<b>Аптайм бота:</b> ' + h + ' часов ' + m + ' минут ' + s + ' секунд\n<b>Пользователей в боте: </b>' + (await User.countDocuments({})) + '\n<b>Памяти использовано:</b> ' + heap + "МБ\n<b>Заявок на вывод:</b> " + await Ticket.countDocuments() + "\n<b>Баланс QIWI:</b> " + balance.accounts[0].balance.amount + "₽\n<b>Бонус к пополнению:</b> " + b + "%", { parse_mode: "HTML", reply_markup: RM_admin })
			})
		}
	}
});

var state = []


User.prototype.inc = function (field, value = 1) {
	this[field] += value;
	return this.save();
}

User.prototype.dec = function (field, value = 1) {
	this[field] -= value;
	return this.save();
}

User.prototype.set = function (field, value) {
	this[field] = value;
	return this.save();
}

function getNavigationIcon(id, tree_id) {
	if (id == tree_id) return '🔵';
	else {
		if (id == 1) return '1️⃣';
		if (id == 2) return '2️⃣';
		if (id == 3) return '3️⃣';
		if (id == 4) return '4️⃣';
		if (id == 5) return '5️⃣';
	}
}

function getNavigationQuery(id, tree_id) {
	if (id == tree_id) return 'none';
	else {
		if (id == 1) return 'trees:shop1';
		if (id == 2) return 'trees:shop2';
		if (id == 3) return 'trees:shop3';
		if (id == 4) return 'trees:shop4';
		if (id == 5) return 'trees:shop5';
	}
}

function getInventoryIcon(id, tree_id) {
	if (id == tree_id) return '🔴';
	else {
		if (id == 1) return '1️⃣';
		if (id == 2) return '2️⃣';
		if (id == 3) return '3️⃣';
		if (id == 4) return '4️⃣';
		if (id == 5) return '5️⃣';
	}
}

function getInventoryQuery(id, tree_id) {
	if (id == tree_id) return 'none';
	else {
		if (id == 1) return 'trees:inv1';
		if (id == 2) return 'trees:inv2';
		if (id == 3) return 'trees:inv3';
		if (id == 4) return 'trees:inv4';
		if (id == 5) return 'trees:inv5';
	}
}

setInterval(async () => {
	qiwi.getOperationHistory({ rows: 10, operation: 'IN' }, (err, response) => {
		response.data.map(async (x) => {
			if (!x.comment) return;
			if (!x.comment.startsWith('B')) return;
			if (txnId.indexOf(x.txnId) !== -1) return;
			let id = Number(x.comment.split("B")[1]);
			if (!id) return;
			let user = await User.findOne({ id });
			if (!user) return;
			if (x.sum.currency != 643) return;
			var b = (await User.findOne({ id: 0 })).deposit
			if (b == 0) {
				await user.inc('deposit', x.sum.amount);
				if (user.deposit + x.sum.amount > 100 && !user.not) {
					await bot.sendMessage(id, `💰 Вы пополнили баланс бота более, чем на 100₽ и приглашаетесь в чат инвесторов!\nПерешлите это сообщение администратору @romkej`);
					await User.findOneAndUpdate({ id: user.id }, { not: true })

				}
				await user.inc('buybalance', x.sum.amount);
				await User.findOneAndUpdate({ id: 0 }, { $inc: { ref: x.sum.amount } })
				bot.sendMessage(id, `Ваш баланс пополнен на ${x.sum.amount}₽`);
				bot.sendMessage("@bogatiry_viplatu", `⚔️ <a href="tg://user?id=${id}">Пользователь</a> пополнил баланс на <b>${x.sum.amount}₽</b>`, { parse_mode: "HTML" })
				ADMINS.map((a) => bot.sendMessage(a, `<a href="tg://user?id=${id}">Игрок</a> сделал депозит: ${x.sum.amount}₽`, { parse_mode: "HTML" }))
			} else {
				await user.inc('deposit', x.sum.amount);
				if (user.deposit + x.sum.amount > 100 && !user.not) {
					await bot.sendMessage(id, `💰 Вы пополнили баланс бота более, чем на 100₽ и приглашаетесь в чат инвесторов!\nПерешлите это сообщение администратору @romkej`);
					await User.findOneAndUpdate({ id: user.id }, { not: true })

				}
				b = b / 100
				await user.inc('buybalance', x.sum.amount + x.sum.amount * b);
				await User.findOneAndUpdate({ id: 0 }, { $inc: { ref: x.sum.amount } })
				bot.sendMessage(id, `Ваш баланс пополнен на ${x.sum.amount}₽ и Вы получаете бонус - ${roundPlus(x.sum.amount * b)}₽!`);
				bot.sendMessage("@bogatiry_viplatu", `⚔️ <a href="tg://user?id=${id}">Пользователь</a> пополнил баланс на <b>${x.sum.amount}₽</b> и получил ${roundPlus(x.sum.amount * b)}₽ бонусом!`, { parse_mode: "HTML" })
				ADMINS.map((a) => bot.sendMessage(a, `<a href="tg://user?id=${id}">Игрок</a> сделал депозит: ${x.sum.amount}₽ + ${roundPlus(x.sum.amount * b)}₽ бонус`, { parse_mode: "HTML" }))

			}
			await User.findOneAndUpdate({ id: user.ref }, { $inc: { buybalance: roundPlus(x.sum.amount * 0.05) } })
			await User.findOneAndUpdate({ id: user.ref }, { $inc: { outbalance: roundPlus(x.sum.amount * 0.05) } })

			bot.sendMessage(user.ref, `🤝 Ваш <a href="tg://user?id=${id}">реферал</a> пополнил баланс на <b>${x.sum.amount}₽</b>!\n💸 Вам начислено по <b>${roundPlus(x.sum.amount * 0.05)}₽</b> на балансы для покупок и для вывода`, { parse_mode: "HTML" }).catch()

			txnId.push(x.txnId)
			require('fs').writeFileSync('./txnId.json', JSON.stringify(txnId));
		});
	});
}, 10000);

async function mmTick() {
	if (mm_status) {
		try {
			mm_i++
			if (mm_type == "text") {
				if (mm_btn_status)
					bot.sendMessage(mm_u[mm_i - 1], mm_text, { reply_markup: { inline_keyboard: [[{ text: mm_btn_text, url: mm_btn_link }]] }, parse_mode: html }).then((err) => { mm_ok++ }).catch((err) => { mm_err++ })
				else
					bot.sendMessage(mm_u[mm_i - 1], mm_text, { parse_mode: html }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { mm_err++ })
			}
			else if (mm_type == "img") {
				if (mm_btn_status)
					bot.sendPhoto(mm_u[mm_i - 1], mm_imgid, { caption: mm_text, reply_markup: { inline_keyboard: [[{ text: mm_btn_text, url: mm_btn_link }]] } }).then((err) => { mm_ok++ }).catch((err) => { mm_err++ })
				else
					bot.sendPhoto(mm_u[mm_i - 1], mm_imgid, { caption: mm_text }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { mm_err++ })
			}
			if (mm_i % 10 == 0) {
				var tek = Math.round((mm_i / mm_total) * 40)
				var str = ""
				for (var i = 0; i < tek; i++) str += "+"
				str += '>'
				for (var i = tek + 1; i < 41; i++) str += "-"
				bot.editMessageText("<b>Выполнено:</b> " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n' + str + "\n\n<b>Статистика:</b>\n<b>Успешных:</b> " + mm_ok + "\n<b>Неуспешных:</b> " + mm_err, { chat_id: mm_achatid, message_id: mm_amsgid, reply_markup: RM_mm1, parse_mode: html })
			}
			if (mm_i == mm_total) {
				mm_status = false;
				bot.editMessageText("Выполнено: " + mm_i + '/' + mm_total, { chat_id: mm_achatid, message_id: mm_amsgid })
				sendAdmins('<b>Рассылка завершена!\n\nСтатистика:\nУспешно:</b> ' + mm_ok + "\n<b>Неуспешно:</b> " + mm_err, { parse_mode: html })
				mm_u = []
			}
		} finally { }
	}
}

setInterval(mmTick, 100);

var mm_total
var mm_i
var mm_status = false
var mm_amsgid
var mm_type
var mm_imgid
var mm_text
var mm_achatid
var mm_btn_status
var mm_btn_text
var mm_btn_link
var mm_ok
var mm_err

async function mm_t(text, amsgid, achatid, btn_status, btn_text, btn_link, size) {
	let ut = await User.find({}, { id: 1 }).sort({ _id: -1 })
	mm_total = ut.length
	console.log(ut)
	mm_u = []
	for (var i = 0; i < mm_total; i++)
		mm_u[i] = ut[i].id
	if (size != 100) {
		mm_u = randomizeArr(mm_u)
		mm_total = Math.ceil(mm_total * (size / 100))
		mm_u.length = mm_total
	}
	ut = undefined
	mm_i = 0;
	mm_amsgid = amsgid
	mm_type = "text"
	mm_text = text
	mm_ok = 0
	mm_err = 0
	mm_achatid = achatid
	if (btn_status) {
		mm_btn_status = true
		mm_btn_text = btn_text
		mm_btn_link = btn_link
	}
	else
		mm_btn_status = false
	mm_status = true;
}

bot.on('photo', async msg => {
	if (msg.from != undefined) {
		var uid = msg.from.id
		if (state[uid] == 7770 && ADMINS.indexOf(uid) !== -1) {
			state[uid] = undefined
			var text = ""
			if (msg.caption != undefined) text = msg.caption
			bot.sendMessage(uid, "Рассылка запущена!").then((e) => {
				if (text.split("#").length == 4) {
					var btn_text = text.split("#")[1].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
					var btn_link = text.split("#")[2].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
					text = text.split("#")[0].replace(/(^\s*)|(\s*)$/g, '').replace(' ', '')
					mm_img(msg.photo[msg.photo.length - 1].file_id, text, e.message_id, e.chat.id, true, btn_text, btn_link, 100)

				}
				else
					mm_img(msg.photo[msg.photo.length - 1].file_id, text, e.message_id, e.chat.id, false, false, false, 100)

			})
		}
	}
})



async function mm_img(img, text, amsgid, achatid, btn_status, btn_text, btn_link, size) {
	let ut = await User.find({}, { id: 1 }).sort({ _id: -1 })
	mm_total = ut.length
	mm_u = []
	for (var i = 0; i < mm_total; i++)
		mm_u[i] = ut[i].id
	if (size != 100) {
		mm_u = randomizeArr(mm_u)
		mm_total = Math.ceil(mm_total * (size / 100))
		mm_u.length = mm_total
	}

	ut = undefined
	mm_i = 0;
	mm_amsgid = amsgid
	mm_type = "img"
	mm_text = text
	mm_imgid = img
	mm_ok = 0
	mm_err = 0
	mm_achatid = achatid
	if (btn_status) {
		mm_btn_status = true
		mm_btn_text = btn_text
		mm_btn_link = btn_link
	}
	else
		mm_btn_status = false
	mm_status = true;
}

function randomizeArr(arr) {
	var j, temp;
	for (var i = arr.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		temp = arr[j];
		arr[j] = arr[i];
		arr[i] = temp;
	}
	return arr;
}

const html = "HTML"

function sendAdmins(text, params) { for (var i = 0; i < ADMINS.length; i++) bot.sendMessage(ADMINS[i], text, params) }

var data = []


function roundPlus(number) { if (isNaN(number)) return false; var m = Math.pow(10, 2); return Math.round(number * m) / m; }

async function main() {
	var u = (await User.find({}, { id: 1 })).map((e) => { return e.id })
	for (var i in u) {
		await User.findOneAndUpdate({ id: u[i] }, { refCount: await User.countDocuments({ ref: u[i] }) })
		console.log(i)
	}

}
//main()

// Обработчик пчеломатки с выдачей пчёл
async function beeMotherUpdater() {
	// Удаление старых пчёл
	var bm = await BeeMother.find({ end_time: { $lte: Date.now() } })
	for (var i in bm) {
		var b = bm[i]
		await BeeMother.deleteOne({ _id: String(b._id) })
		bot.sendMessage(b.creator_id, `⚜️ Ваша ратуша принесла 4 чемпиона и исчезла`)
	}
	// Выдача диких пчёл
	bm = await BeeMother.find({ beesGet: { $lte: 4 }, nextBeeGet: { $lte: Date.now() } })
	console.log(bm)
	for (var i in bm) {
		var b = bm[i]
		await BeeMother.findOneAndUpdate({ _id: String(b._id) }, { nextBeeGet: b.nextBeeGet + 1000 * 60 * 60 * 24 * 7, beesGet: b.beesGet + 1 })
		await WildBee.insertMany([{ creator_id: b.creator_id, start_time: Date.now(), level: 1, bee_profit: 0 }])
		bot.sendMessage(b.creator_id, `🐲 Ратуша принесла Вам чемпиона!`)
	}
}
setInterval(beeMotherUpdater, 1000 * 60 * 60)

// Обработчик выдачи мёда дикими пчёлами
async function wildBeesUpdater() {
	if (new Date().getMinutes() == 0) {
		var wb = await WildBee.find()
		for (var i in wb) {
			var b = wb[i]
			await User.findOneAndUpdate({ id: b.creator_id }, { $inc: { wb_profits: wbProfits[b.level] } })
			await WildBee.findOneAndUpdate({ _id: String(b._id) }, { $inc: { bee_profit: wbProfits[b.level] } })
		}
	}
}
setInterval(wildBeesUpdater, 1000 * 60)

//User.updateMany({}, {payout: 0, not: false}).then()
