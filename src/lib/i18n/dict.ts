/**
 * UI-строки лендинга. Ключи — стабильные слаги, перевод — две версии.
 * Не клади сюда тексты из mock-данных (FAQ, кейсы, сценарии) — они идут через repository.
 */

export const dict = {
  ru: {
    // Header
    "nav.features": "Возможности",
    "nav.cases": "Кейсы",
    "nav.scenarios": "Сценарии",
    "nav.pricing": "Тарифы",
    "nav.faq": "FAQ",
    "nav.login": "Войти",
    "nav.demo": "Демо",
    "nav.menuOpen": "Открыть меню",
    "nav.menuClose": "Закрыть меню",
    "nav.toLanding": "botme — на главную",
    "nav.langSwitch": "Сменить язык",
    "nav.langRu": "RU",
    "nav.langEn": "EN",

    // CTA
    "cta.launch3": "Запустить за 3 дня",
    "cta.howItWorks": "Как это работает",
    "cta.getDemo": "Получить демо",
    "cta.first100": "Программа «Первые 100»",

    // Hero
    "hero.badge": "Запуск за 3 дня. Все каналы.",
    "hero.titleA": "AI-ассистент,",
    "hero.titleHighlight": "не теряет",
    "hero.titleB": "который",
    "hero.titleC": "ваших клиентов",
    "hero.subtitle":
      "Отвечает за 7 секунд в Telegram, на сайте, в Avito. Квалифицирует лида, записывает в CRM, доводит до сделки. Без выгорания, ночью и в выходные.",
    "hero.statResponse": "Среднее время ответа",
    "hero.statResponseValue": "7 сек",
    "hero.statConv": "Конверсия в лид",
    "hero.statConvValue": "+38%",
    "hero.statLaunch": "Запуск",
    "hero.statLaunchValue": "3 дня",

    // Trust
    "trust.copy": "Уже работает в малом и среднем бизнесе РФ и СНГ",

    // How
    "how.eyebrow": "Как это работает",
    "how.title": "От «хочу попробовать» до первого ответа клиента за 3 дня",
    "how.desc":
      "Без долгих внедрений и кода. Мы делаем ассистента руками, вы согласовываете тексты и сценарии.",

    // Features
    "features.eyebrow": "Что делает ассистент",
    "features.title": "Не справочник. Полноценный менеджер первой линии",
    "features.desc":
      "Знает продукт, ведёт диалог, квалифицирует лида и пишет результат в CRM. Вы получаете готовый контакт, а не «надо перезвонить».",

    // Channels
    "channels.eyebrow": "Каналы",
    "channels.title": "Все, где пишут ваши клиенты",
    "channels.desc": "Один ассистент работает сразу везде. История диалогов и CRM-связки общие.",
    "channels.beta": "Beta",
    "channels.soon": "Soon",

    // Scenarios
    "scenarios.eyebrow": "Сценарии",
    "scenarios.title": "Понимаем специфику вашей ниши",
    "scenarios.desc":
      "Каждая ниша: свой набор сценариев, тональностей и интеграций. Ниже то, что мы уже сделали.",

    // Demo section
    "demo.badge": "Демо за 30 минут",
    "demo.title": "Покажем ассистента на ваших данных",
    "demo.desc":
      "Оставьте контакт, соберём прототип под вашу нишу за 30 минут и созвонимся в Zoom. Без презентаций и обещаний «революции».",
    "demo.chatTitle": "Демо для вашей ниши",
    "demo.chatSubtitle": "Парус · Недвижимость",

    // Benefits
    "benefits.eyebrow": "Зачем",
    "benefits.title": "Что ассистент делает лучше живого менеджера",
    "benefits.desc":
      "Не вместо команды, а вместо того, чтобы нанимать ещё одного человека на первую линию.",

    // Launch
    "launch.eyebrow": "Запуск",
    "launch.title": "3 дня от старта до первого диалога",
    "launch.desc":
      "Никаких «согласований 2 недели». Команда neeklo собирает ассистента руками, вы только утверждаете.",
    "launch.day1": "День 1",
    "launch.day1Title": "Загружаем базу знаний",
    "launch.day1Desc": "Берём ваши тексты, прайс, FAQ. Структурируем под ассистента.",
    "launch.day2": "День 2",
    "launch.day2Title": "Настраиваем сценарии и тон",
    "launch.day2Desc": "Прописываем поведение под нишу. Тестируем на реальных диалогах.",
    "launch.day3": "День 3",
    "launch.day3Title": "Подключаем каналы и CRM",
    "launch.day3Desc":
      "Telegram, сайт, Avito, на ваш выбор. Связываем с amoCRM или Bitrix24.",

    // Pricing
    "pricing.eyebrow": "Тарифы",
    "pricing.title": "Понятные цены. Без сюрпризов",
    "pricing.desc":
      "Платите за работу ассистента, а не за «лицензии» и «места». Возврат в первые 14 дней.",
    "pricing.perMonth": "/ мес",
    "pricing.hit": "Хит",
    "pricing.compareCopy": "Нужно сравнение тарифов и ответы по биллингу?",
    "pricing.compareLink": "Подробная страница тарифов →",

    // Cases
    "cases.eyebrow": "Кейсы",
    "cases.title": "Как это работает у реальных клиентов",
    "cases.desc":
      "Цифры из живых проектов. Не «увеличили продажи в 10 раз», а конкретные заявки и часы.",

    // FAQ
    "faq.eyebrow": "FAQ",
    "faq.title": "Что обычно спрашивают",
    "faq.notFoundTitle": "Не нашли ответ?",
    "faq.notFoundDesc": "Напишите в Telegram, отвечаем в течение 30 минут в рабочее время.",
    "faq.allLink": "Все вопросы и категории →",

    // Final CTA
    "final.title": "Запустите ассистента за 3 дня. Платите, когда увидите первые лиды.",
    "final.desc":
      "Бесплатное демо за 30 минут. Возврат в первые 14 дней. Без долгих контрактов.",

    // Demo form
    "form.name": "Как вас зовут",
    "form.namePlaceholder": "Иван",
    "form.contact": "Телефон, email или @username",
    "form.contactPlaceholder": "+7 999 123-45-67 или @ivan",
    "form.niche": "Ниша",
    "form.nichePlaceholder": "Выберите нишу",
    "form.submitting": "Отправляем…",
    "form.contactPhone": "Телефон",
    "form.contactEmail": "Email",
    "form.contactTelegram": "Telegram",
    "form.hintPhone": "Распознали телефон — позвоним или напишем в WhatsApp.",
    "form.hintEmail": "Распознали email — отправим демо-доступ туда.",
    "form.hintTelegram": "Распознали Telegram — напишем в личку.",
    "form.errorRecheck": "Проверьте подсвеченные поля и отправьте ещё раз.",
    "form.consentA": "Отправляя заявку, вы соглашаетесь с",
    "form.consentPrivacy": "обработкой персональных данных",
    "form.consentB": "и условиями",
    "form.consentOffer": "оферты",
    "form.successTitle": "Готово, мы получили заявку",
    "form.successDescA": "Менеджер напишет в течение 30 минут в рабочее время. По срочным вопросам — Telegram",
    "form.successAgain": "Отправить ещё одну",
    "form.toastSuccessTitle": "Заявка отправлена",
    "form.toastSuccessDesc": "Свяжемся в течение 30 минут в рабочее время.",
    "form.toastErrorTitle": "Не удалось отправить",
    "form.toastErrorDesc":
      "Попробуйте ещё раз или напишите в Telegram @botme_support.",

    // Footer
    "footer.tagline":
      "AI-ассистенты, которые отвечают клиентам, квалифицируют лидов и доводят до сделки.",
    "footer.product": "Продукт",
    "footer.company": "Компания",
    "footer.legal": "Документы",
    "footer.linkFeatures": "Возможности",
    "footer.linkIntegrations": "Каналы и интеграции",
    "footer.linkScenarios": "Сценарии под нишу",
    "footer.linkPricing": "Тарифы",
    "footer.linkFirst100": "Первые 100",
    "footer.linkAbout": "О команде",
    "footer.linkCases": "Кейсы",
    "footer.linkFaq": "FAQ",
    "footer.linkContacts": "Контакты",
    "footer.linkPrivacy": "Политика конфиденциальности",
    "footer.linkOffer": "Договор-оферта",
    "footer.copyright": "продукт neeklo.studio",
    "footer.legalEntity": "ИП Клочко Никита Николаевич · ИНН 7806123456",

    // Niche
    "niche.real_estate": "Недвижимость",
    "niche.auto": "Авто",
    "niche.auto_long": "Авто и Avito",
    "niche.clinic": "Клиники",
    "niche.services": "Услуги",
    "niche.online_school": "Онлайн-школы",
    "niche.agency": "Агентства",
    "niche.other": "Другое",
  },

  en: {
    // Header
    "nav.features": "Features",
    "nav.cases": "Case studies",
    "nav.scenarios": "Scenarios",
    "nav.pricing": "Pricing",
    "nav.faq": "FAQ",
    "nav.login": "Sign in",
    "nav.demo": "Demo",
    "nav.menuOpen": "Open menu",
    "nav.menuClose": "Close menu",
    "nav.toLanding": "botme — to homepage",
    "nav.langSwitch": "Switch language",
    "nav.langRu": "RU",
    "nav.langEn": "EN",

    // CTA
    "cta.launch3": "Launch in 3 days",
    "cta.howItWorks": "How it works",
    "cta.getDemo": "Get a demo",
    "cta.first100": "“First 100” program",

    // Hero
    "hero.badge": "Launch in 3 days. Every channel.",
    "hero.titleA": "An AI assistant",
    "hero.titleHighlight": "won’t lose",
    "hero.titleB": "that",
    "hero.titleC": "your customers",
    "hero.subtitle":
      "Replies in 7 seconds on Telegram, your website and Avito. Qualifies the lead, logs it to your CRM, and closes the deal — no burnout, no nights off, no weekends off.",
    "hero.statResponse": "Average response time",
    "hero.statResponseValue": "7 sec",
    "hero.statConv": "Lead conversion",
    "hero.statConvValue": "+38%",
    "hero.statLaunch": "Launch",
    "hero.statLaunchValue": "3 days",

    // Trust
    "trust.copy": "Already running for SMB across Russia and the CIS",

    // How
    "how.eyebrow": "How it works",
    "how.title": "From “let’s try it” to a customer reply — in 3 days",
    "how.desc":
      "No long rollouts, no code. We build the assistant by hand; you sign off on the copy and the scenarios.",

    // Features
    "features.eyebrow": "What the assistant does",
    "features.title": "Not a knowledge base. A real first-line salesperson",
    "features.desc":
      "It knows the product, drives the conversation, qualifies the lead and writes the outcome to your CRM. You get a ready-to-call contact, not a “need to follow up”.",

    // Channels
    "channels.eyebrow": "Channels",
    "channels.title": "Everywhere your customers write",
    "channels.desc":
      "One assistant runs across all of them. Conversation history and CRM bindings are shared.",
    "channels.beta": "Beta",
    "channels.soon": "Soon",

    // Scenarios
    "scenarios.eyebrow": "Scenarios",
    "scenarios.title": "We get the specifics of your niche",
    "scenarios.desc":
      "Every niche has its own scripts, tone and integrations. Below — what we’ve already shipped.",

    // Demo section
    "demo.badge": "30-minute demo",
    "demo.title": "We’ll show the assistant on your data",
    "demo.desc":
      "Drop a contact and we’ll prototype an assistant for your niche in 30 minutes and jump on a Zoom call. No slides, no “revolution” promises.",
    "demo.chatTitle": "Demo for your niche",
    "demo.chatSubtitle": "Parus · Real estate",

    // Benefits
    "benefits.eyebrow": "Why",
    "benefits.title": "Where the assistant beats a human first-line manager",
    "benefits.desc":
      "Not a replacement for your team — a replacement for the next first-line hire you were about to make.",

    // Launch
    "launch.eyebrow": "Launch",
    "launch.title": "3 days from kickoff to the first conversation",
    "launch.desc":
      "No two-week “sign-off cycles”. The neeklo team builds the assistant by hand; you only approve.",
    "launch.day1": "Day 1",
    "launch.day1Title": "We load the knowledge base",
    "launch.day1Desc":
      "Your copy, price list, FAQ. We structure it for the assistant.",
    "launch.day2": "Day 2",
    "launch.day2Title": "We set scenarios and tone",
    "launch.day2Desc":
      "Behaviour tuned to your niche. Tested on real conversations.",
    "launch.day3": "Day 3",
    "launch.day3Title": "We connect channels and CRM",
    "launch.day3Desc":
      "Telegram, website, Avito — your pick. Wired to amoCRM or Bitrix24.",

    // Pricing
    "pricing.eyebrow": "Pricing",
    "pricing.title": "Clear pricing. No surprises",
    "pricing.desc":
      "You pay for the assistant’s work — not “licences” or “seats”. Refund within the first 14 days.",
    "pricing.perMonth": "/ mo",
    "pricing.hit": "Popular",
    "pricing.compareCopy": "Need a side-by-side comparison and billing answers?",
    "pricing.compareLink": "Full pricing page →",

    // Cases
    "cases.eyebrow": "Case studies",
    "cases.title": "How it works for real customers",
    "cases.desc":
      "Numbers from live projects. Not “10× growth” — concrete leads and hours saved.",

    // FAQ
    "faq.eyebrow": "FAQ",
    "faq.title": "What people usually ask",
    "faq.notFoundTitle": "Didn’t find the answer?",
    "faq.notFoundDesc":
      "Drop us a line on Telegram — we reply within 30 minutes during business hours.",
    "faq.allLink": "All questions and categories →",

    // Final CTA
    "final.title": "Launch the assistant in 3 days. Pay once you see the first leads.",
    "final.desc":
      "Free 30-minute demo. Refund within the first 14 days. No long-term contracts.",

    // Demo form
    "form.name": "Your name",
    "form.namePlaceholder": "Alex",
    "form.contact": "Phone, email or @username",
    "form.contactPlaceholder": "+1 555 123-4567 or @alex",
    "form.niche": "Niche",
    "form.nichePlaceholder": "Pick your niche",
    "form.submitting": "Sending…",
    "form.contactPhone": "Phone",
    "form.contactEmail": "Email",
    "form.contactTelegram": "Telegram",
    "form.hintPhone": "Detected a phone — we’ll call or message you on WhatsApp.",
    "form.hintEmail": "Detected an email — we’ll send the demo access there.",
    "form.hintTelegram": "Detected a Telegram handle — we’ll DM you.",
    "form.errorRecheck": "Check the highlighted fields and submit again.",
    "form.consentA": "By submitting you agree to our",
    "form.consentPrivacy": "privacy policy",
    "form.consentB": "and",
    "form.consentOffer": "terms of service",
    "form.successTitle": "Done — we’ve got your request",
    "form.successDescA":
      "A manager will reply within 30 minutes during business hours. For urgent matters — Telegram",
    "form.successAgain": "Send another one",
    "form.toastSuccessTitle": "Request sent",
    "form.toastSuccessDesc": "We’ll be in touch within 30 minutes during business hours.",
    "form.toastErrorTitle": "Couldn’t send it",
    "form.toastErrorDesc":
      "Try again or message us on Telegram @botme_support.",

    // Footer
    "footer.tagline":
      "AI assistants that reply to customers, qualify leads, and close the deal.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.linkFeatures": "Features",
    "footer.linkIntegrations": "Channels & integrations",
    "footer.linkScenarios": "Scenarios by niche",
    "footer.linkPricing": "Pricing",
    "footer.linkFirst100": "First 100",
    "footer.linkAbout": "About the team",
    "footer.linkCases": "Case studies",
    "footer.linkFaq": "FAQ",
    "footer.linkContacts": "Contacts",
    "footer.linkPrivacy": "Privacy policy",
    "footer.linkOffer": "Terms of service",
    "footer.copyright": "a neeklo.studio product",
    "footer.legalEntity": "Sole proprietor Nikita Klochko · TIN 7806123456",

    // Niche
    "niche.real_estate": "Real estate",
    "niche.auto": "Auto",
    "niche.auto_long": "Auto & Avito",
    "niche.clinic": "Clinics",
    "niche.services": "Services",
    "niche.online_school": "Online schools",
    "niche.agency": "Agencies",
    "niche.other": "Other",
  },
} as const;

export type Dict = typeof dict;
