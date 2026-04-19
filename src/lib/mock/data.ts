/**
 * Mock-данные для repository. Никаких "Lorem ipsum".
 * Только реальные тексты на русском, отражающие позиционирование botme.
 */

import type {
  Assistant,
  BenefitItem,
  CaseItem,
  Channel,
  ChatMessage,
  FaqItem,
  FeatureItem,
  First100Benefit,
  First100MathRow,
  First100Stats,
  HowItWorksStep,
  KpiSnapshot,
  Lead,
  OnboardingStep,
  PricingComparisonRow,
  PricingPlan,
  ScenarioItem,
  TrustLogo,
} from "@/types/entities";

export const channels: Channel[] = [
  { id: "telegram", name: "Telegram", description: "Бот в личке и группах", status: "live" },
  { id: "website", name: "Сайт", description: "Виджет-чат на любом сайте", status: "live" },
  { id: "avito", name: "Avito", description: "Ответы на сообщения по объявлениям", status: "live" },
  { id: "vk", name: "ВКонтакте", description: "Сообщения сообщества", status: "live" },
  { id: "whatsapp", name: "WhatsApp", description: "Через официальный WABA", status: "beta" },
  { id: "instagram", name: "Instagram DM", description: "Личные сообщения профиля", status: "beta" },
];

export const features: FeatureItem[] = [
  {
    id: "answer",
    title: "Отвечает за 7 секунд",
    description: "Клиент пишет — ассистент отвечает мгновенно, в вашем тоне, по вашим правилам.",
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
    description: "Работает 24/7. Ночные заявки — больше не потерянные деньги.",
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
    description: "Один раз настроили — работает год. Без увольнений и переобучения.",
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
    description: "Под бренд: от строгого юриста до дружелюбного консультанта. Прописываем, что делать в нестандартных кейсах.",
  },
  {
    id: "h3",
    number: "03",
    title: "Подключаем каналы",
    description: "Telegram, сайт, Avito, ВКонтакте — за пару часов. Тестируем на реальных диалогах.",
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
    bullet: "Записывает на приём, напоминает, переносит — без оператора.",
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
  { feature: "CRM-интеграции", values: { start: "—", pro: "amoCRM, Bitrix24", max: "все + кастом" } },
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
      "Если у вас уже есть тексты о продукте и доступ к каналу — 1–3 рабочих дня. Мы сами загружаем базу знаний, настраиваем тон и сценарии.",
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
      "Да: amoCRM, Битрикс24, retailCRM, YClients. Если CRM нестандартная — делаем интеграцию на тарифе Масштаб.",
  },
  {
    id: "q5",
    category: "general",
    question: "А если клиент захочет говорить с человеком?",
    answer:
      "Передаём диалог менеджеру в один клик с полной историей. Контроль остаётся за вами.",
  },
  {
    id: "q6",
    category: "pricing",
    question: "Можно ли вернуть деньги, если не подойдёт?",
    answer:
      "Да, в первые 14 дней — возврат 100% без вопросов. Дальше — работа по договору.",
  },
  {
    id: "q7",
    category: "security",
    question: "Где хранятся данные клиентов?",
    answer:
      "На серверах в РФ, в соответствии с 152-ФЗ. Доступ только у вас и вашей команды.",
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
    description: "Команда neeklo собирает ассистента под ваш бизнес. 40+ часов работы лида и продакта.",
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
    name: "Avito — авто с пробегом",
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
    name: "Стоматология — запись",
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

export const kpi: KpiSnapshot = {
  conversations: 680,
  leads: 141,
  qualified: 96,
  conversion: 0.21,
  activeAssistants: 2,
};

export const onboarding: OnboardingStep[] = [
  { id: "o1", title: "Подключить канал", description: "Telegram, сайт или Avito.", done: true },
  { id: "o2", title: "Загрузить базу знаний", description: "PDF, ссылки, тексты о продукте.", done: true },
  { id: "o3", title: "Настроить тон ассистента", description: "От строгого до дружелюбного.", done: false },
  { id: "o4", title: "Подключить CRM", description: "amoCRM, Битрикс24, YClients.", done: false },
  { id: "o5", title: "Запустить в работу", description: "После проверки сценариев.", done: false },
];
