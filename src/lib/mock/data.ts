/**
 * Mock-данные для repository. Никаких "Lorem ipsum".
 * Только реальные тексты на русском, отражающие позиционирование botme.
 */

import type {
  ActivityPoint,
  Assistant,
  BenefitItem,
  CaseItem,
  CaseStudy,
  Channel,
  ChatMessage,
  DashboardKpi,
  FaqItem,
  FeatureItem,
  First100Benefit,
  First100MathRow,
  First100Stats,
  HowItWorksStep,
  Integration,
  KpiSnapshot,
  Lead,
  LegalDocument,
  Notification,
  OnboardingStep,
  PricingComparisonRow,
  PricingPlan,
  ScenarioDetail,
  ScenarioItem,
  TeamMember,
  TeamPerson,
  TrustLogo,
  UsageStat,
  User,
} from "@/types/entities";

export const channels: Channel[] = [
  { id: "telegram", name: "Telegram", description: "Бот в личке и группах", status: "live" },
  { id: "website", name: "Сайт", description: "Виджет-чат на любом сайте", status: "live" },
  { id: "avito", name: "Avito", description: "Ответы на сообщения по объявлениям", status: "live" },
  { id: "vk", name: "ВКонтакте", description: "Сообщения сообщества", status: "live" },
  { id: "whatsapp", name: "WhatsApp", description: "Через официальный WABA", status: "beta" },
  {
    id: "instagram",
    name: "Instagram DM",
    description: "Личные сообщения профиля",
    status: "beta",
  },
];

export const features: FeatureItem[] = [
  {
    id: "answer",
    title: "Отвечает за 7 секунд",
    description: "Клиент пишет. Ассистент отвечает мгновенно, в вашем тоне, по вашим правилам.",
    icon: "MessageSquare",
  },
  {
    id: "qualify",
    title: "Квалифицирует лида",
    description: "Задаёт уточняющие вопросы, собирает контакт, бюджет, сроки и передаёт менеджеру.",
    icon: "Filter",
  },
  {
    id: "sell",
    title: "Доводит до сделки",
    description: "Подбирает предложение из вашей базы, отправляет ссылку на оплату или бронь.",
    icon: "Target",
  },
  {
    id: "crm",
    title: "Пишет в CRM",
    description: "Создаёт сделку, ставит задачу менеджеру, ничего не теряет.",
    icon: "Database",
  },
];

export const benefits: BenefitItem[] = [
  {
    id: "b1",
    title: "Не уходит на обед",
    description: "Работает 24/7. Ночные заявки, больше не потерянные деньги.",
    icon: "Moon",
  },
  {
    id: "b2",
    title: "Не путается в продукте",
    description: "Знает прайс, склад, акции, FAQ. Никогда не отвечает «уточню у менеджера».",
    icon: "BookOpen",
  },
  {
    id: "b3",
    title: "Не выгорает на сотом «А что у вас по цене?»",
    description: "Отвечает с тем же тоном на 1-й и 1000-й вопрос.",
    icon: "Battery",
  },
  {
    id: "b4",
    title: "Не уходит к конкурентам",
    description: "Один раз настроили и работает год. Без увольнений и переобучения.",
    icon: "Shield",
  },
];

export const howItWorks: HowItWorksStep[] = [
  {
    id: "h1",
    number: "01",
    title: "Загружаем базу знаний",
    description: "Прайс, FAQ, тексты о продукте, ссылки на сайт. Любой формат.",
  },
  {
    id: "h2",
    number: "02",
    title: "Настраиваем тон и сценарии",
    description:
      "Под бренд: от строгого юриста до дружелюбного консультанта. Прописываем, что делать в нестандартных кейсах.",
  },
  {
    id: "h3",
    number: "03",
    title: "Подключаем каналы",
    description:
      "Telegram, сайт, Avito, ВКонтакте: подключаем за пару часов. Тестируем на реальных диалогах.",
  },
  {
    id: "h4",
    number: "04",
    title: "Запускаем в работу",
    description: "Через 3 дня после старта ассистент отвечает клиентам и складывает лидов в CRM.",
  },
];

export const scenarios: ScenarioItem[] = [
  {
    id: "realestate",
    niche: "real_estate",
    title: "Недвижимость",
    bullet: "Подбирает квартиру по бюджету и району, бронирует показ.",
    metric: "+38% к конверсии в показ",
  },
  {
    id: "auto",
    niche: "auto",
    title: "Авто и Avito",
    bullet: "Отвечает на 100% сообщений по объявлениям, фильтрует перекупов.",
    metric: "−6 ч в день у менеджера",
  },
  {
    id: "clinic",
    niche: "clinic",
    title: "Клиники",
    bullet: "Записывает на приём, напоминает, переносит, без оператора.",
    metric: "92% записей без человека",
  },
  {
    id: "school",
    niche: "online_school",
    title: "Онлайн-школы",
    bullet: "Объясняет программу, считает рассрочку, ведёт на оплату.",
    metric: "×2.1 к выручке с трафика",
  },
  {
    id: "services",
    niche: "services",
    title: "Услуги",
    bullet: "Считает стоимость, согласует сроки, бронирует мастера.",
    metric: "+62 заявки в месяц",
  },
  {
    id: "agency",
    niche: "agency",
    title: "Агентства",
    bullet: "Квалифицирует клиента по чек-листу до созвона, экономит время команды.",
    metric: "−40% времени на брифинг",
  },
];

export const pricing: PricingPlan[] = [
  {
    id: "start",
    name: "Старт",
    priceRub: 4900,
    yearlyDiscount: 0.15,
    tagline: "Один ассистент, один канал. Чтобы попробовать.",
    forWho: "Для одиночного бизнеса, который хочет автоматизировать первые ответы.",
    features: [
      "1 ассистент",
      "1 канал на выбор",
      "До 1 000 диалогов / мес",
      "База знаний до 50 страниц",
      "Email-поддержка",
      "Базовая аналитика",
    ],
    cta: { label: "Запустить за 3 дня", intent: "secondary" },
  },
  {
    id: "growth",
    name: "Рост",
    priceRub: 12900,
    yearlyDiscount: 0.15,
    tagline: "Для бизнеса, который уже считает выручку с трафика.",
    forWho: "Если есть отдел продаж и поток заявок 100+ в месяц.",
    features: [
      "До 3 ассистентов",
      "Все каналы",
      "До 10 000 диалогов / мес",
      "Интеграция с CRM",
      "База знаний без лимита",
      "Поддержка в Telegram",
      "Расширенная аналитика",
      "Экспорт в Excel",
    ],
    highlighted: true,
    cta: { label: "Запустить за 3 дня", intent: "primary" },
  },
  {
    id: "scale",
    name: "Масштаб",
    priceRub: 34900,
    yearlyDiscount: 0.15,
    tagline: "Несколько направлений, отделы продаж, кастомные интеграции.",
    forWho: "Для сетевых компаний и бизнесов с несколькими продуктовыми линейками.",
    features: [
      "Без ограничений на ассистентов",
      "Все каналы + API",
      "Без лимита диалогов",
      "Кастомные интеграции",
      "Выделенный менеджер",
      "SLA 99.9%",
      "White-label опция",
      "Приоритет в новых фичах",
    ],
    cta: { label: "Обсудить с командой", intent: "secondary" },
  },
];

export const pricingComparison: PricingComparisonRow[] = [
  { feature: "Ассистенты", values: { start: "1", pro: "до 3", max: "без лимита" } },
  { feature: "Каналы", values: { start: "1 на выбор", pro: "все", max: "все + API" } },
  { feature: "Диалогов в месяц", values: { start: "1 000", pro: "10 000", max: "без лимита" } },
  { feature: "База знаний", values: { start: "50 МБ", pro: "без лимита", max: "без лимита" } },
  {
    feature: "CRM-интеграции",
    values: { start: "—", pro: "amoCRM, Bitrix24", max: "все + кастом" },
  },
  { feature: "API доступ", values: { start: "—", pro: "—", max: "✓" } },
  { feature: "SLA", values: { start: "—", pro: "—", max: "99.9%" } },
  { feature: "Менеджер onboarding", values: { start: "—", pro: "✓", max: "выделенный" } },
  { feature: "White-label", values: { start: "—", pro: "—", max: "✓" } },
];

export const faq: FaqItem[] = [
  {
    id: "q1",
    category: "general",
    question: "Сколько занимает запуск?",
    answer:
      "Если у вас уже есть тексты о продукте и доступ к каналу, 1–3 рабочих дня. Мы сами загружаем базу знаний, настраиваем тон и сценарии.",
  },
  {
    id: "q2",
    category: "general",
    question: "Ассистент будет отвечать как живой человек?",
    answer:
      "Да, в вашем тоне. Мы настраиваем стиль под бренд: от строгого юриста до дружелюбного консультанта.",
  },
  {
    id: "q3",
    category: "tech",
    question: "Что если ассистент не знает ответа?",
    answer:
      "Он честно говорит, что уточнит, и передаёт диалог менеджеру. Никаких выдуманных фактов.",
  },
  {
    id: "q4",
    category: "integrations",
    question: "Подключаете к нашей CRM?",
    answer:
      "Да: amoCRM, Битрикс24, retailCRM, YClients. Если CRM нестандартная, делаем интеграцию на тарифе Масштаб.",
  },
  {
    id: "q5",
    category: "general",
    question: "А если клиент захочет говорить с человеком?",
    answer: "Передаём диалог менеджеру в один клик с полной историей. Контроль остаётся за вами.",
  },
  {
    id: "q6",
    category: "pricing",
    question: "Можно ли вернуть деньги, если не подойдёт?",
    answer: "Да, в первые 14 дней возврат 100% без вопросов. Дальше работаем по договору.",
  },
  {
    id: "q7",
    category: "security",
    question: "Где хранятся данные клиентов?",
    answer: "На серверах в РФ, в соответствии с 152-ФЗ. Доступ только у вас и вашей команды.",
  },
];

export const cases: CaseItem[] = [
  {
    id: "c1",
    slug: "kontur",
    company: "Студия ремонта «Контур»",
    niche: "services",
    quote: "Раньше теряли 40% заявок ночью. Сейчас ассистент закрывает их сам.",
    author: "Игорь Лапин, основатель",
    metric: "+62 заявки / мес",
  },
  {
    id: "c2",
    slug: "sever",
    company: "Автосалон «Север»",
    niche: "auto",
    quote: "Avito-менеджер освободился полностью. Закрыли 3 ставки.",
    author: "Марина Соколова, РОП",
    metric: "−420 000 ₽ ФОТ / мес",
  },
  {
    id: "c3",
    slug: "alpha",
    company: "Стоматология «Альфа»",
    niche: "clinic",
    quote: "Запись теперь идёт круглосуточно. Администратор только подтверждает.",
    author: "Алексей Гринёв, директор",
    metric: "92% записей без оператора",
  },
];

export const trustLogos: TrustLogo[] = [
  { id: "t1", name: "Контур", initials: "КН" },
  { id: "t2", name: "Север", initials: "СВ" },
  { id: "t3", name: "Альфа", initials: "АЛ" },
  { id: "t4", name: "Маяк", initials: "МК" },
  { id: "t5", name: "Орбита", initials: "ОР" },
  { id: "t6", name: "Линия", initials: "ЛН" },
];

/* ───── Mock-чаты для Hero / Demo ───── */

export const heroChat: ChatMessage[] = [
  { id: "m1", role: "user", text: "Здравствуйте, есть двушка в Парусе до 14 млн?", time: "14:32" },
  {
    id: "m2",
    role: "bot",
    text: "Да, есть 3 варианта. Подскажите — нужен балкон и какой этаж предпочтителен?",
    time: "14:32",
  },
  { id: "m3", role: "user", text: "Балкон да, этаж от 5-го", time: "14:33" },
  {
    id: "m4",
    role: "bot",
    text: "Подобрал две квартиры — 8 и 12 этаж. Удобно записать на показ в субботу?",
    time: "14:33",
  },
  { id: "m5", role: "user", text: "Давайте на 12:00", time: "14:34" },
  {
    id: "m6",
    role: "bot",
    text: "Готово. Записал к Анне на субботу в 12:00. Скину адрес и контакт менеджера в Telegram.",
    time: "14:34",
  },
];

/* ───── Программа «Первые 100» ───── */

export const first100Stats: First100Stats = {
  taken: 47,
  total: 100,
};

export const first100Benefits: First100Benefit[] = [
  {
    id: "f1",
    title: "Личная настройка под нишу",
    description:
      "Команда neeklo собирает ассистента под ваш бизнес. 40+ часов работы лида и продакта.",
    icon: "Wrench",
  },
  {
    id: "f2",
    title: "Pro-подписка со скидкой 40% навсегда",
    description: "9 900 ₽/мес → 5 940 ₽/мес. Цена не меняется, пока вы клиент.",
    icon: "Percent",
  },
  {
    id: "f3",
    title: "Личный менеджер на onboarding",
    description: "Помогает первый месяц: от подключения CRM до правок в сценариях.",
    icon: "User",
  },
  {
    id: "f4",
    title: "Приоритет в новых фичах",
    description: "Раньше всех получаете доступ к бета-версиям и голосовым ассистентам.",
    icon: "Sparkles",
  },
];

export const first100Math: First100MathRow[] = [
  { feature: "Настройка под ключ", regular: "350 000 ₽", now: "150 000 ₽" },
  { feature: "Подписка Pro навсегда", regular: "9 900 ₽/мес", now: "5 940 ₽/мес" },
  { feature: "Менеджер onboarding", regular: "+50 000 ₽", now: "включено" },
  { feature: "Экономия за первый год", regular: "—", now: "247 520 ₽" },
];

/* ───── Кабинет (для будущих фаз) ───── */

export const assistants: Assistant[] = [
  {
    id: "a1",
    name: "Продажи квартир ЖК Парус",
    niche: "real_estate",
    status: "active",
    channels: ["telegram", "website", "avito"],
    conversations7d: 412,
    leads7d: 87,
    conversion: 0.21,
    updatedAt: "2026-04-17T10:24:00Z",
  },
  {
    id: "a2",
    name: "Avito: авто с пробегом",
    niche: "auto",
    status: "active",
    channels: ["avito"],
    conversations7d: 268,
    leads7d: 54,
    conversion: 0.2,
    updatedAt: "2026-04-18T08:11:00Z",
  },
  {
    id: "a3",
    name: "Стоматология: запись",
    niche: "clinic",
    status: "paused",
    channels: ["website", "telegram"],
    conversations7d: 0,
    leads7d: 0,
    conversion: 0,
    updatedAt: "2026-04-12T19:02:00Z",
  },
];

export const leads: Lead[] = [
  {
    id: "l1",
    assistantId: "a1",
    contact: "+7 916 ••• 42 18",
    channel: "telegram",
    status: "qualified",
    summary: "Двушка в Парусе, бюджет до 14 млн, ипотека одобрена.",
    createdAt: "2026-04-19T07:42:00Z",
  },
  {
    id: "l2",
    assistantId: "a2",
    contact: "@avito_user_2841",
    channel: "avito",
    status: "new",
    summary: "Kia Rio 2019, торг, готов смотреть в выходные.",
    createdAt: "2026-04-19T06:15:00Z",
  },
];

/* ════════════════════════════════════════════════════════════════
   USER / AUTH (mock)
   ════════════════════════════════════════════════════════════════ */

export const mockUser: User = {
  id: "u_demo",
  name: "Никита Клочко",
  username: "nikita_neeklo",
  email: "nikita@neeklo.studio",
  avatarInitials: "НК",
  workspaceName: "neeklo studio",
  role: "owner",
  plan: "growth",
};

/* ════════════════════════════════════════════════════════════════
   ИНТЕГРАЦИИ (CRM и системы)
   ════════════════════════════════════════════════════════════════ */

export const integrations: Integration[] = [
  {
    id: "amocrm",
    name: "amoCRM",
    category: "crm",
    description: "Создаёт сделки, задачи, заполняет поля по диалогу.",
    initials: "AM",
    status: "live",
  },
  {
    id: "bitrix24",
    name: "Битрикс24",
    category: "crm",
    description: "Лиды, сделки, задачи, ответственные, всё в Битриксе.",
    initials: "Б24",
    status: "live",
  },
  {
    id: "yclients",
    name: "YClients",
    category: "crm",
    description: "Запись клиентов в YClients прямо из чата.",
    initials: "YC",
    status: "live",
  },
  {
    id: "retailcrm",
    name: "retailCRM",
    category: "crm",
    description: "Заказы, клиенты, сегменты, синхронизируем.",
    initials: "RC",
    status: "beta",
  },
  {
    id: "gsheets",
    name: "Google Sheets",
    category: "data",
    description: "Лиды и диалоги в вашу таблицу. Без программистов.",
    initials: "GS",
    status: "live",
  },
  {
    id: "notion",
    name: "Notion",
    category: "data",
    description: "База знаний из вашего Notion-воркспейса.",
    initials: "N",
    status: "live",
  },
  {
    id: "webhook",
    name: "Webhook",
    category: "automation",
    description: "Отправляем события в любую систему через HTTP.",
    initials: "WH",
    status: "live",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "automation",
    description: "5000+ интеграций через Zapier. Без кода.",
    initials: "Z",
    status: "beta",
  },
  {
    id: "telegram_crm",
    name: "Telegram-уведомления",
    category: "automation",
    description: "Каждый лид, сразу в чат менеджера в Telegram.",
    initials: "TG",
    status: "live",
  },
];

/* ════════════════════════════════════════════════════════════════
   КЕЙСЫ (детальные long-read)
   ════════════════════════════════════════════════════════════════ */

const industryByNiche: Record<string, string> = {
  real_estate: "Недвижимость",
  auto: "Авто",
  clinic: "Клиники",
  online_school: "Онлайн-школы",
  services: "Услуги",
  agency: "Агентства",
  other: "Другое",
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "kontur",
    company: "Студия ремонта «Контур»",
    niche: "services",
    industry: industryByNiche.services,
    region: "Санкт-Петербург",
    summary:
      "Ассистент закрывает ночные заявки и считает смету в первом сообщении. Менеджеры выходят на горячих лидов.",
    heroMetrics: [
      { label: "Заявок в месяц", value: "+62", delta: "+41%" },
      { label: "Заявки ночью", value: "100%", delta: "обработка" },
      { label: "Время первого ответа", value: "8 сек", delta: "−12 мин" },
    ],
    task: [
      "До botme «Контур» терял до 40% входящих ночью и в выходные. Менеджеры просыпались в Telegram под 30 сообщений и физически не успевали отвечать всем — клиент уходил к конкуренту, который ответил первым.",
      "Кроме того, на расчёт сметы по типовому ремонту уходило 20–30 минут общения: тип объекта, площадь, материалы, сроки. Половина клиентов отваливалась на этом этапе.",
    ],
    solution: [
      "Запустили ассистента в Telegram-боте и виджете на сайте. Загрузили прайс-лист, типовые сметы, FAQ по этапам ремонта.",
      "Прописали сценарий квалификации: тип объекта (квартира/коммерция), площадь, бюджет, желаемые сроки. Ассистент сам считает первичную смету и отправляет PDF.",
      "Подключили amoCRM: каждый качественный лид падает в воронку с заполненными полями. Менеджер с утра видит готовых к разговору клиентов.",
    ],
    setup: {
      assistant: "Контур — продажи и квалификация",
      channels: ["telegram", "website"],
      integrations: ["amoCRM", "Google Sheets"],
    },
    resultMetrics: [
      { label: "Конверсия в смету", value: "73%", delta: "+28 п.п." },
      { label: "ФОТ менеджера", value: "−85к ₽", delta: "освобождена ставка" },
      { label: "Закрытых сделок", value: "+18", delta: "/ мес" },
    ],
    quote: {
      text: "Мы думали, бот будет «довеском». Через месяц поняли: он делает работу полутора менеджеров. И не просит отпуск.",
      author: "Игорь Лапин",
      role: "основатель «Контур»",
    },
    related: ["sever", "alpha"],
  },
  {
    slug: "sever",
    company: "Автосалон «Север»",
    niche: "auto",
    industry: industryByNiche.auto,
    region: "Краснодар",
    summary:
      "Avito-менеджер был узким горлом. Ассистент закрыл 3 ставки, ускорил ответ до 5 секунд, отсёк перекупов.",
    heroMetrics: [
      { label: "Сообщений в день", value: "320+", delta: "100% ответы" },
      { label: "Сэкономлено ФОТ", value: "−420к ₽", delta: "/ мес" },
      { label: "Конверсия в визит", value: "+22%", delta: "" },
    ],
    task: [
      "У «Севера» висело 80+ объявлений на Avito. Сообщений приходило 250–400 в день. Менеджер не успевал отвечать — приходилось держать трёх в смену, и всё равно теряли минимум 30% обращений.",
      "Среди обращений 40% — перекупы и просто «торгуемся ради торга». Менеджеры выгорали на пустых диалогах.",
    ],
    solution: [
      "Подключили ассистента к Avito-аккаунту. Загрузили карточки всех машин с пробегом, ценами, комплектациями, историей.",
      "Сценарий: первое сообщение — приветствие, проверка по двум вопросам (на ходу/в кредит), отсев перекупов через цену торга. Качественные лиды — сразу к менеджеру.",
      "Интегрировали с retailCRM: автомобиль резервируется на 24 часа, менеджер получает задачу.",
    ],
    setup: {
      assistant: "Avito — авто с пробегом",
      channels: ["avito"],
      integrations: ["retailCRM", "Telegram-уведомления"],
    },
    resultMetrics: [
      { label: "Закрытых ставок", value: "−3", delta: "оптимизация" },
      { label: "Качественных лидов", value: "+38%", delta: "" },
      { label: "Перекупов отсечено", value: "94%", delta: "автоматом" },
    ],
    quote: {
      text: "Раньше тратили на ФОТ Avito-менеджеров 720к. Сейчас 300к плюс botme. Качество лидов выросло.",
      author: "Марина Соколова",
      role: "руководитель отдела продаж",
    },
    related: ["kontur", "polis"],
  },
  {
    slug: "alpha",
    company: "Стоматология «Альфа»",
    niche: "clinic",
    industry: industryByNiche.clinic,
    region: "Москва",
    summary:
      "92% записей идёт без участия администратора. Ассистент работает 24/7 в WhatsApp и на сайте.",
    heroMetrics: [
      { label: "Запись без оператора", value: "92%", delta: "" },
      { label: "Среднее время записи", value: "1.5 мин", delta: "−7 мин" },
      { label: "Ночных записей", value: "+27%", delta: "" },
    ],
    task: [
      "В «Альфе» 6 врачей и один администратор. В часы пик звонки пропускались, а WhatsApp превращался в свалку — клиенты ждали ответа 2–3 часа.",
      "Половина пациентов не дожидалась подтверждения и записывалась в другую клинику.",
    ],
    solution: [
      "Подключили ассистента в WhatsApp Business и виджет на сайте. Интегрировали с YClients — расписание врачей в реальном времени.",
      "Сценарий: услуга → врач → удобное окно → подтверждение. Ассистент сам предлагает альтернативные слоты, если нужное занято.",
      "За день до приёма — напоминание. Если пациент пишет «не могу» — мгновенный перенос.",
    ],
    setup: {
      assistant: "Стоматология — запись",
      channels: ["website", "whatsapp"],
      integrations: ["YClients"],
    },
    resultMetrics: [
      { label: "Записей в месяц", value: "+34%", delta: "" },
      { label: "Заполняемость окон", value: "94%", delta: "+19 п.п." },
      { label: "NPS администратора", value: "+41", delta: "не выгорает" },
    ],
    quote: {
      text: "Администратор перестала тонуть в WhatsApp. Теперь она занимается живыми пациентами в клинике, а запись идёт сама.",
      author: "Алексей Гринёв",
      role: "директор",
    },
    related: ["polis", "kontur"],
  },
  {
    slug: "polis",
    company: "ЖК «Полис»",
    niche: "real_estate",
    industry: industryByNiche.real_estate,
    region: "Екатеринбург",
    summary:
      "Ассистент квалифицирует по бюджету, ипотеке и району, бронирует показ. Менеджеры приходят к готовому к покупке клиенту.",
    heroMetrics: [
      { label: "Конверсия в показ", value: "+38%", delta: "" },
      { label: "Время до показа", value: "1.2 дня", delta: "−3 дня" },
      { label: "Сделок в месяц", value: "+11", delta: "" },
    ],
    task: [
      "Отдел продаж тратил 60% времени на «А есть двушка до 8 млн?». Половина обращений — нерелевантные.",
      "Менеджеры быстро устают и начинают игнорировать сложные вопросы — теряются «горячие» клиенты с конкретным запросом.",
    ],
    solution: [
      "Загрузили шахматку, цены, планировки, информацию по ипотечным программам.",
      "Сценарий квалификации: бюджет, ипотека одобрена/нет, нужное количество комнат, район, сроки переезда. Только после этого — приглашение на показ.",
      "Интеграция с Битрикс24: показ сразу попадает в календарь менеджера, клиент получает SMS-напоминание.",
    ],
    setup: {
      assistant: "Продажи квартир ЖК",
      channels: ["telegram", "website", "avito"],
      integrations: ["Битрикс24"],
    },
    resultMetrics: [
      { label: "Релевантных обращений", value: "+72%", delta: "" },
      { label: "Время менеджера", value: "−5 ч", delta: "/ день" },
      { label: "Конверсия в сделку", value: "+14%", delta: "" },
    ],
    quote: {
      text: "Менеджер теперь приходит на показ к человеку, который точно купит, а не «посмотреть». Это другой уровень работы.",
      author: "Дмитрий Орлов",
      role: "коммерческий директор",
    },
    related: ["alpha", "skill"],
  },
  {
    slug: "skill",
    company: "Онлайн-школа «Skill Up»",
    niche: "online_school",
    industry: industryByNiche.online_school,
    region: "удалённо",
    summary:
      "Ассистент рассказывает программу, считает рассрочку и доводит до оплаты. Конверсия трафика выросла в 2.1 раза.",
    heroMetrics: [
      { label: "Выручка с трафика", value: "×2.1", delta: "" },
      { label: "Цена лида", value: "−43%", delta: "" },
      { label: "До оплаты ведёт", value: "31%", delta: "+18 п.п." },
    ],
    task: [
      "До botme «Skill Up» имела сильный маркетинг, но слабый отдел продаж: менеджеры не успевали обрабатывать всех. Стоимость лида росла, а конверсия в оплату падала.",
      "Особенно тяжело было с вопросами по рассрочке — нужно было помнить условия 4 банков-партнёров.",
    ],
    solution: [
      "Ассистент рассказывает программу курса под уровень студента, считает рассрочку (4 банка, до 24 мес), отправляет ссылку на оплату.",
      "Сценарии под холодных и тёплых: разные приветствия, разная глубина вопросов, разный CTA.",
      "Менеджер подключается только на «дожим» сложных кейсов — те, кому нужен звонок.",
    ],
    setup: {
      assistant: "Skill Up — продажи курсов",
      channels: ["telegram", "website", "vk"],
      integrations: ["amoCRM", "Webhook"],
    },
    resultMetrics: [
      { label: "Оплат в месяц", value: "+170%", delta: "" },
      { label: "Чек средний", value: "+22%", delta: "за счёт апсейла" },
      { label: "Возвратов", value: "−6%", delta: "лучше квалификация" },
    ],
    quote: {
      text: "Перестали драться за каждого лида — теперь у нас лидов больше, чем рук. Botme — главный продавец компании.",
      author: "Анна Тимохина",
      role: "директор по маркетингу",
    },
    related: ["polis", "edge"],
  },
  {
    slug: "edge",
    company: "Маркетинг-агентство «Edge»",
    niche: "agency",
    industry: industryByNiche.agency,
    region: "Москва",
    summary:
      "Брифинг занимал 3 встречи. Ассистент квалифицирует клиента до созвона, команда экономит десятки часов в неделю.",
    heroMetrics: [
      { label: "Время на брифинг", value: "−40%", delta: "" },
      { label: "Качество ТЗ", value: "+62%", delta: "по нашей шкале" },
      { label: "Мусорных лидов", value: "−74%", delta: "автоотсев" },
    ],
    task: [
      "У «Edge» был стабильный поток входящих, но 60% времени продакта уходило на брифинг с клиентами, которые в итоге не подходили по бюджету или скоупу.",
      "Каждая встреча — час на zoom, час на оформление ТЗ. И часто — впустую.",
    ],
    solution: [
      "Ассистент в Telegram и на сайте проводит первичный брифинг по чек-листу: индустрия, задача, бюджет, сроки, KPI.",
      "Если бюджет ниже минимального — вежливый отказ с рекомендацией. Если подходит — назначает встречу с конкретным продактом, отправляет ему готовое ТЗ.",
      "Интеграция с Notion: каждый бриф ложится в базу клиентов с метками.",
    ],
    setup: {
      assistant: "Edge — квалификация клиентов",
      channels: ["telegram", "website"],
      integrations: ["Notion", "Google Sheets"],
    },
    resultMetrics: [
      { label: "Время продакта", value: "+12 ч", delta: "/ неделя" },
      { label: "Конверсия встреч → договор", value: "+38%", delta: "" },
      { label: "Длинных циклов", value: "−51%", delta: "" },
    ],
    quote: {
      text: "Раньше команда тонула в брифингах. Сейчас на встрече мы сразу обсуждаем стратегию — botme сделал всю предварительную работу.",
      author: "Ренат Юсупов",
      role: "founder",
    },
    related: ["skill", "kontur"],
  },
];

/* ════════════════════════════════════════════════════════════════
   СЦЕНАРИИ ПО НИШАМ (детальные посадочные)
   ════════════════════════════════════════════════════════════════ */

export const scenarioDetails: Record<string, ScenarioDetail> = {
  real_estate: {
    niche: "real_estate",
    title: "AI-ассистент для недвижимости",
    industry: industryByNiche.real_estate,
    pain: "Менеджеры тонут в «А есть двушка до 8 млн?» и теряют горячих клиентов. Ассистент квалифицирует за 2 минуты.",
    tasks: [
      "Квалифицирует по бюджету, району, ипотеке",
      "Записывает на показ с подтверждением",
      "Отвечает по объектам и планировкам 24/7",
      "Собирает документы для ипотеки",
      "Напоминает о просмотрах и переносит при отмене",
    ],
    dialog: [
      {
        id: "rd1",
        role: "user",
        text: "Здравствуйте, есть двушка в Парусе до 14 млн?",
        time: "14:32",
      },
      {
        id: "rd2",
        role: "bot",
        text: "Да, есть 3 варианта. Подскажите — нужен балкон и какой этаж предпочтителен?",
        time: "14:32",
      },
      { id: "rd3", role: "user", text: "Балкон да, этаж от 5-го", time: "14:33" },
      {
        id: "rd4",
        role: "bot",
        text: "Подобрал две квартиры — 8 и 12 этаж, обе с балконом и видом на парк. Удобно записать на показ в субботу?",
        time: "14:33",
      },
      { id: "rd5", role: "user", text: "Давайте на 12:00", time: "14:34" },
      {
        id: "rd6",
        role: "bot",
        text: "Готово. Записал к Анне на субботу в 12:00. Скину адрес и контакт менеджера в Telegram.",
        time: "14:34",
      },
    ],
    integrations: [
      { name: "Битрикс24", description: "Показ → задача менеджеру" },
      { name: "amoCRM", description: "Лид с заполненными полями" },
      { name: "2ГИС", description: "Карта объекта в чате" },
      { name: "Webhook", description: "Свои скрипты ипотечного калькулятора" },
    ],
    caseSlug: "polis",
  },
  auto: {
    niche: "auto",
    title: "AI-ассистент для авто и Avito",
    industry: industryByNiche.auto,
    pain: "Avito-менеджер не успевает за 300 сообщений в день. Ассистент отвечает за 5 секунд и отсеивает перекупов.",
    tasks: [
      "Отвечает на 100% сообщений по объявлениям",
      "Фильтрует перекупов по проверочным вопросам",
      "Резервирует автомобиль на 24 часа",
      "Согласует тест-драйв и подтверждает встречу",
      "Считает trade-in и кредит/рассрочку",
    ],
    dialog: [
      { id: "au1", role: "user", text: "Kia Rio 2019 ещё в наличии?", time: "11:08" },
      {
        id: "au2",
        role: "bot",
        text: "Да, в наличии. Подскажите — для себя смотрите или под перепродажу?",
        time: "11:08",
      },
      { id: "au3", role: "user", text: "Себе, в кредит", time: "11:09" },
      {
        id: "au4",
        role: "bot",
        text: "Хорошо. С нашим партнёром одобрение за 30 минут, ставка от 6.5%. Удобно подъехать на тест-драйв в субботу?",
        time: "11:09",
      },
      { id: "au5", role: "user", text: "Да, в первой половине дня", time: "11:10" },
      {
        id: "au6",
        role: "bot",
        text: "Записал на 11:00 в субботу. Машину закреплю за вами на 24 часа. Менеджер Сергей подтвердит и пришлёт адрес.",
        time: "11:10",
      },
    ],
    integrations: [
      { name: "retailCRM", description: "Сделка по машине" },
      { name: "Avito API", description: "Прямая связка" },
      { name: "Telegram", description: "Уведомления менеджеру" },
      { name: "Webhook", description: "Своя оценка trade-in" },
    ],
    caseSlug: "sever",
  },
  clinic: {
    niche: "clinic",
    title: "AI-ассистент для клиник",
    industry: industryByNiche.clinic,
    pain: "Администратор тонет в звонках и WhatsApp. Ассистент записывает 92% пациентов сам, без оператора.",
    tasks: [
      "Записывает на приём по расписанию врачей",
      "Подбирает альтернативные слоты при занятости",
      "Напоминает за день и за 2 часа до приёма",
      "Переносит запись в один клик",
      "Отвечает на вопросы по услугам и ценам",
    ],
    dialog: [
      {
        id: "cl1",
        role: "user",
        text: "Здравствуйте, можно записаться к ортодонту?",
        time: "20:14",
      },
      {
        id: "cl2",
        role: "bot",
        text: "Конечно. Это для консультации или для продолжения лечения?",
        time: "20:14",
      },
      { id: "cl3", role: "user", text: "Консультация", time: "20:15" },
      {
        id: "cl4",
        role: "bot",
        text: "Ближайшее время у Анны Викторовны — пятница 16:00 или суббота 11:30. Какой вариант удобен?",
        time: "20:15",
      },
      { id: "cl5", role: "user", text: "Суббота 11:30", time: "20:15" },
      {
        id: "cl6",
        role: "bot",
        text: "Записал. За день до визита пришлю напоминание. Адрес: Тверская, 12, 3 этаж.",
        time: "20:16",
      },
    ],
    integrations: [
      { name: "YClients", description: "Расписание и запись" },
      { name: "WhatsApp Business", description: "Канал общения" },
      { name: "Webhook", description: "СМС-напоминания" },
      { name: "Google Sheets", description: "Выгрузка отчётов" },
    ],
    caseSlug: "alpha",
  },
  online_school: {
    niche: "online_school",
    title: "AI-ассистент для онлайн-школ",
    industry: industryByNiche.online_school,
    pain: "Менеджеры не успевают обрабатывать лидов, конверсия в оплату падает. Ассистент рассказывает программу и доводит до оплаты.",
    tasks: [
      "Объясняет программу под уровень студента",
      "Считает рассрочку по 4 банкам",
      "Отправляет ссылку на оплату прямо в чат",
      "Напоминает о незавершённой оплате",
      "Передаёт сложные кейсы менеджеру",
    ],
    dialog: [
      {
        id: "sc1",
        role: "user",
        text: "Подскажите, курс по Python подойдёт без опыта?",
        time: "13:02",
      },
      {
        id: "sc2",
        role: "bot",
        text: "Да, в курсе есть подготовительный модуль на 2 недели — с нуля до базового уровня. После него — основная программа.",
        time: "13:02",
      },
      { id: "sc3", role: "user", text: "А по оплате — есть рассрочка?", time: "13:03" },
      {
        id: "sc4",
        role: "bot",
        text: "Конечно. Тинькофф и Альфа дают до 12 месяцев — по 7 900 ₽/мес без переплат. Хотите оформить заявку?",
        time: "13:03",
      },
      { id: "sc5", role: "user", text: "Давайте", time: "13:04" },
      {
        id: "sc6",
        role: "bot",
        text: "Отправляю ссылку на анкету. Решение за 5 минут, после — сразу доступ к курсу.",
        time: "13:04",
      },
    ],
    integrations: [
      { name: "amoCRM", description: "Воронка студента" },
      { name: "GetCourse", description: "Доступ к курсу" },
      { name: "Webhook", description: "Свои платёжные ссылки" },
      { name: "ВКонтакте", description: "Канал общения" },
    ],
    caseSlug: "skill",
  },
  services: {
    niche: "services",
    title: "AI-ассистент для услуг",
    industry: industryByNiche.services,
    pain: "Клиенты пишут ночью и в выходные, менеджеры не успевают. Ассистент закрывает заявки и считает смету сам.",
    tasks: [
      "Считает стоимость по типовому прайсу",
      "Согласует сроки и записывает на встречу",
      "Бронирует мастера на дату",
      "Отправляет PDF с предложением",
      "Передаёт горячих клиентов менеджеру",
    ],
    dialog: [
      { id: "sv1", role: "user", text: "Сколько будет стоить ремонт двушки 60 м²?", time: "23:47" },
      {
        id: "sv2",
        role: "bot",
        text: "Смотря какой уровень — косметический, капитальный или дизайнерский?",
        time: "23:47",
      },
      { id: "sv3", role: "user", text: "Капитальный, под чистовую", time: "23:48" },
      {
        id: "sv4",
        role: "bot",
        text: "По типовому прайсу — от 1 350 000 ₽ с материалами эконом-сегмента. Срок 8–10 недель. Прислать PDF со сметой по комнатам?",
        time: "23:48",
      },
      { id: "sv5", role: "user", text: "Да, и можно посмотреть портфолио", time: "23:49" },
      {
        id: "sv6",
        role: "bot",
        text: "Отправляю. Если устроит — забронируем замер на удобный день. С утра свяжется менеджер Антон.",
        time: "23:49",
      },
    ],
    integrations: [
      { name: "amoCRM", description: "Сделка с заполненной сметой" },
      { name: "Google Sheets", description: "Выгрузка лидов" },
      { name: "Telegram", description: "Уведомления мастеру" },
      { name: "Webhook", description: "Свой калькулятор" },
    ],
    caseSlug: "kontur",
  },
  agency: {
    niche: "agency",
    title: "AI-ассистент для агентств",
    industry: industryByNiche.agency,
    pain: "Команда тонет в брифингах с нерелевантными клиентами. Ассистент квалифицирует до встречи, экономит десятки часов.",
    tasks: [
      "Проводит брифинг по чек-листу",
      "Отсекает клиентов ниже минимального бюджета",
      "Назначает встречу с нужным продактом",
      "Готовит ТЗ к созвону",
      "Складывает базу клиентов с метками",
    ],
    dialog: [
      { id: "ag1", role: "user", text: "Хочу заказать сайт для нового бренда", time: "16:18" },
      {
        id: "ag2",
        role: "bot",
        text: "Здорово. Расскажите кратко — какая индустрия, есть ли уже бренд-айдентика и какой ориентировочный бюджет?",
        time: "16:18",
      },
      { id: "ag3", role: "user", text: "Косметика, айдентика есть, бюджет 1.5 млн", time: "16:19" },
      {
        id: "ag4",
        role: "bot",
        text: "Отлично, это в нашей зоне. Подскажите сроки и цели — продажи через сайт, имидж бренда или что-то ещё?",
        time: "16:19",
      },
      { id: "ag5", role: "user", text: "Запуск к сентябрю, основное — продажи", time: "16:20" },
      {
        id: "ag6",
        role: "bot",
        text: "Принял. Назначу встречу с продактом Анной — она профильно ведёт e-commerce. Удобно в четверг 11:00 или пятницу 15:00?",
        time: "16:20",
      },
    ],
    integrations: [
      { name: "Notion", description: "База клиентов и брифов" },
      { name: "Google Calendar", description: "Запись на встречу" },
      { name: "Telegram", description: "Уведомления продакту" },
      { name: "Webhook", description: "Своя CRM" },
    ],
    caseSlug: "edge",
  },
  other: {
    niche: "other",
    title: "AI-ассистент под вашу нишу",
    industry: "Другая ниша",
    pain: "Не нашли свою нишу? Команда neeklo соберёт ассистента под любой бизнес, от логистики до b2b SaaS.",
    tasks: [
      "Адаптация сценариев под вашу специфику",
      "Интеграция с любой CRM или базой",
      "Личный продакт-менеджер на запуск",
      "Запуск за 5–7 рабочих дней",
    ],
    dialog: [],
    integrations: [],
    caseSlug: "kontur",
  },
};

/* ════════════════════════════════════════════════════════════════
   КОМАНДА (для /about и /app/team)
   ════════════════════════════════════════════════════════════════ */

export const teamPeople: TeamPerson[] = [
  {
    id: "p1",
    name: "Никита Клочко",
    role: "Founder, продукт",
    bio: "8 лет в продуктах для b2b. До botme, продакт-директор в neeklo.studio.",
    initials: "НК",
  },
  {
    id: "p2",
    name: "Игорь Шамин",
    role: "Lead Engineer",
    bio: "Архитектура, инфраструктура, надёжность. Строит системы, которые не падают.",
    initials: "ИШ",
  },
  {
    id: "p3",
    name: "Данил Прохоров",
    role: "Product Manager",
    bio: "Отвечает за onboarding и customer success. Лично запускает первых клиентов.",
    initials: "ДП",
  },
  {
    id: "p4",
    name: "Ренат Юсупов",
    role: "Sales & Partnerships",
    bio: "Работает с клиентами и интеграторами. Знает CRM и боль продаж изнутри.",
    initials: "РЮ",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "tm1",
    name: "Никита Клочко",
    email: "nikita@neeklo.studio",
    role: "owner",
    status: "active",
    initials: "НК",
    joinedAt: "2025-09-01",
  },
  {
    id: "tm2",
    name: "Анна Степанова",
    email: "anna@neeklo.studio",
    role: "admin",
    status: "active",
    initials: "АС",
    joinedAt: "2025-11-12",
  },
  {
    id: "tm3",
    name: "Дмитрий Орлов",
    email: "dmitry@example.com",
    role: "editor",
    status: "pending",
    initials: "ДО",
    joinedAt: "2026-04-15",
  },
];

/* ════════════════════════════════════════════════════════════════
   УВЕДОМЛЕНИЯ И USAGE
   ════════════════════════════════════════════════════════════════ */

export const notifications: Notification[] = [
  {
    id: "n1",
    kind: "lead",
    title: "Новый качественный лид",
    description: "Telegram · ассистент «Продажи квартир ЖК Парус» · бюджет 12 млн",
    createdAt: "2026-04-19T07:42:00Z",
    read: false,
    href: "/app/inbox",
  },
  {
    id: "n2",
    kind: "channel_error",
    title: "Ошибка подключения Avito",
    description: "Токен истёк, ассистент «Avito: авто с пробегом» не отвечает.",
    createdAt: "2026-04-19T05:11:00Z",
    read: false,
    href: "/app/integrations",
  },
  {
    id: "n3",
    kind: "quota",
    title: "Использовано 80% сообщений месяца",
    description: "8 015 из 10 000. Осталось 11 дней до сброса.",
    createdAt: "2026-04-18T22:00:00Z",
    read: false,
    href: "/app/billing",
  },
  {
    id: "n4",
    kind: "billing",
    title: "Списание прошло успешно",
    description: "Тариф Рост, 12 900 ₽. Чек отправили на email.",
    createdAt: "2026-04-15T10:00:00Z",
    read: true,
    href: "/app/billing",
  },
  {
    id: "n5",
    kind: "system",
    title: "Новая фича: голосовые ассистенты в бете",
    description: "Можно тестировать на тарифе Рост и выше. Подключить?",
    createdAt: "2026-04-12T14:30:00Z",
    read: true,
  },
];

export const usageStat: UsageStat = {
  period: "Апрель 2026",
  messages: { used: 8015, limit: 10000 },
  assistants: { used: 2, limit: 3 },
  channels: { used: 4, limit: 6 },
  knowledgeMb: { used: 42, limit: 100 },
};

/* ════════════════════════════════════════════════════════════════
   DASHBOARD KPI + ACTIVITY
   ════════════════════════════════════════════════════════════════ */

const sp = (vals: number[]) => vals.map((y, i) => ({ x: i, y }));

export const dashboardKpis: DashboardKpi[] = [
  {
    label: "Новые лиды (7д)",
    value: "141",
    trend: { delta: "+18%", positive: true },
    spark: sp([12, 18, 14, 22, 19, 28, 28]),
  },
  {
    label: "Диалоги (7д)",
    value: "680",
    trend: { delta: "+12%", positive: true },
    spark: sp([78, 92, 88, 110, 96, 105, 111]),
  },
  {
    label: "Среднее время ответа",
    value: "8 сек",
    trend: { delta: "−3 сек", positive: true },
    spark: sp([14, 12, 11, 10, 9, 9, 8]),
  },
  {
    label: "Использовано сообщений",
    value: "80%",
    trend: { delta: "8 015 / 10 000", positive: false },
    spark: sp([22, 35, 48, 56, 64, 72, 80]),
    hint: "До сброса 11 дней",
  },
];

export const activity30d: ActivityPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 2, 21 + i);
  const base = 60 + Math.round(40 * Math.sin(i / 4) + i * 1.6);
  return {
    date: d.toISOString().slice(0, 10),
    messages: base + Math.round(Math.random() * 25),
    leads: Math.round((base + Math.random() * 25) * 0.18),
  };
});

/* ════════════════════════════════════════════════════════════════
   LEGAL
   ════════════════════════════════════════════════════════════════ */

export const legalDocs: Record<"privacy" | "offer", LegalDocument> = {
  privacy: {
    slug: "privacy",
    title: "Политика конфиденциальности",
    version: "1.2",
    updatedAt: "2026-04-01",
    intro:
      "Настоящая политика описывает, как ИП Клочко Никита Николаевич (далее — «Оператор», botme) обрабатывает персональные данные пользователей сервиса botme.",
    sections: [
      {
        heading: "1. Какие данные мы собираем",
        paragraphs: [
          "Контактные данные пользователя: имя, телефон, email, Telegram-username — указываются добровольно при регистрации и в формах обратной связи.",
          "Технические данные: IP-адрес, тип устройства, версия браузера, временные метки обращений к сервису.",
          "Данные диалогов клиентов с ассистентами в каналах, подключённых пользователем, — для предоставления услуг сервиса.",
        ],
      },
      {
        heading: "2. Цели обработки",
        paragraphs: [
          "Предоставление услуг: создание и управление AI-ассистентами, обработка диалогов, передача лидов в CRM.",
          "Связь с пользователем по вопросам сервиса: уведомления, поддержка, биллинг.",
          "Аналитика и улучшение продукта: обезличенная агрегированная статистика.",
        ],
      },
      {
        heading: "3. Хранение и защита",
        paragraphs: [
          "Все данные хранятся на серверах в Российской Федерации в соответствии с требованиями 152-ФЗ «О персональных данных».",
          "Доступ к данным имеет только пользователь и уполномоченные сотрудники botme в объёме, необходимом для предоставления услуг.",
          "Применяются организационные и технические меры защиты: шифрование при передаче, контроль доступа, аудит-логи.",
        ],
      },
      {
        heading: "4. Передача третьим лицам",
        paragraphs: [
          "Данные передаются интегрированным сервисам (CRM, мессенджеры) только по явному указанию пользователя — для выполнения функций сервиса.",
          "Без согласия пользователя данные не передаются третьим лицам, кроме случаев, предусмотренных законом.",
        ],
      },
      {
        heading: "5. Права пользователя",
        paragraphs: [
          "Пользователь вправе в любое время запросить информацию об обработке своих данных, потребовать их изменения, удаления или прекращения обработки.",
          "Запросы направляйте на email: privacy@botme.ru. Срок ответа — до 10 рабочих дней.",
        ],
      },
      {
        heading: "6. Изменения политики",
        paragraphs: [
          "Оператор вправе изменять настоящую политику. Актуальная версия всегда доступна на странице /legal/privacy. О существенных изменениях пользователи уведомляются по email.",
        ],
      },
    ],
  },
  offer: {
    slug: "offer",
    title: "Договор-оферта",
    version: "2.0",
    updatedAt: "2026-04-01",
    intro:
      "Настоящий документ является публичной офертой ИП Клочко Никита Николаевич (ИНН 7806123456) на заключение договора об оказании услуг сервиса botme. Оплата услуг означает полное и безоговорочное принятие условий оферты.",
    sections: [
      {
        heading: "1. Предмет договора",
        paragraphs: [
          "Исполнитель предоставляет Заказчику доступ к сервису botme — программному комплексу для создания и управления AI-ассистентами в мессенджерах и на сайтах.",
          "Объём услуг определяется выбранным тарифом и описан на странице /pricing.",
        ],
      },
      {
        heading: "2. Стоимость и порядок оплаты",
        paragraphs: [
          "Стоимость услуг указана в рублях РФ и НДС не облагается (УСН).",
          "Оплата производится авансом за выбранный период (месяц или год). При выборе годового тарифа предоставляется скидка 15%.",
          "Списание производится автоматически с привязанной банковской карты в дату следующего расчётного периода.",
        ],
      },
      {
        heading: "3. Возврат средств",
        paragraphs: [
          "В первые 14 календарных дней с момента первой оплаты Заказчик вправе расторгнуть договор и получить возврат 100% уплаченной суммы без объяснения причин.",
          "По истечении 14 дней возврат производится пропорционально неиспользованному периоду по запросу Заказчика.",
        ],
      },
      {
        heading: "4. Обязательства сторон",
        paragraphs: [
          "Исполнитель обеспечивает работоспособность сервиса в режиме 24/7. Плановые работы — с предварительным уведомлением.",
          "Заказчик не передаёт доступ к аккаунту третьим лицам и не использует сервис для рассылки спама и противоправных целей.",
        ],
      },
      {
        heading: "5. Ответственность",
        paragraphs: [
          "Исполнитель не несёт ответственности за решения, принятые на основании ответов AI-ассистентов. Финальная ответственность за коммуникацию с клиентами лежит на Заказчике.",
          "В случае простоя сервиса по вине Исполнителя свыше 1% времени в месяц — компенсация в виде продления подписки.",
        ],
      },
      {
        heading: "6. Конфиденциальность",
        paragraphs: [
          "Стороны обязуются сохранять конфиденциальность данных, ставших известными в ходе исполнения договора.",
          "Обработка персональных данных регулируется Политикой конфиденциальности /legal/privacy.",
        ],
      },
      {
        heading: "7. Реквизиты Исполнителя",
        paragraphs: [
          "ИП Клочко Никита Николаевич",
          "ИНН: 7806123456",
          "Email: legal@botme.ru",
          "Адрес: 197198, г. Санкт-Петербург, Большой пр. П.С.",
        ],
      },
    ],
  },
};

export const kpi: KpiSnapshot = {
  conversations: 680,
  leads: 141,
  qualified: 96,
  conversion: 0.21,
  activeAssistants: 2,
};

export const onboarding: OnboardingStep[] = [
  { id: "o1", title: "Подключить канал", description: "Telegram, сайт или Avito.", done: true },
  {
    id: "o2",
    title: "Загрузить базу знаний",
    description: "PDF, ссылки, тексты о продукте.",
    done: true,
  },
  {
    id: "o3",
    title: "Настроить тон ассистента",
    description: "От строгого до дружелюбного.",
    done: false,
  },
  { id: "o4", title: "Подключить CRM", description: "amoCRM, Битрикс24, YClients.", done: false },
  { id: "o5", title: "Запустить в работу", description: "После проверки сценариев.", done: false },
];
