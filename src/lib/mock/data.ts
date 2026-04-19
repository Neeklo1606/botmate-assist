/**
 * Mock-данные для repository. Никаких "Lorem ipsum".
 * Только реальные тексты на русском, отражающие позиционирование botme.
 */

import type {
  Assistant,
  CaseItem,
  Channel,
  FaqItem,
  FeatureItem,
  KpiSnapshot,
  Lead,
  OnboardingStep,
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
];

export const pricing: PricingPlan[] = [
  {
    id: "start",
    name: "Старт",
    priceRub: 4900,
    tagline: "Один ассистент, один канал. Чтобы попробовать.",
    features: [
      "1 ассистент",
      "1 канал на выбор",
      "До 1 000 диалогов / мес",
      "База знаний до 50 страниц",
      "Email-поддержка",
    ],
    cta: { label: "Запустить за 3 дня", intent: "secondary" },
  },
  {
    id: "growth",
    name: "Рост",
    priceRub: 12900,
    tagline: "Для бизнеса, который уже считает выручку с трафика.",
    features: [
      "До 3 ассистентов",
      "Все каналы",
      "До 10 000 диалогов / мес",
      "Интеграция с CRM",
      "База знаний без лимита",
      "Поддержка в Telegram",
    ],
    highlighted: true,
    cta: { label: "Запустить за 3 дня", intent: "primary" },
  },
  {
    id: "scale",
    name: "Масштаб",
    priceRub: 34900,
    tagline: "Несколько направлений, отделы продаж, кастомные интеграции.",
    features: [
      "Без ограничений на ассистентов",
      "Все каналы + API",
      "Без лимита диалогов",
      "Кастомные интеграции",
      "Выделенный менеджер",
      "SLA 99.9%",
    ],
    cta: { label: "Обсудить с командой", intent: "secondary" },
  },
];

export const faq: FaqItem[] = [
  {
    id: "q1",
    question: "Сколько занимает запуск?",
    answer:
      "Если у вас уже есть тексты о продукте и доступ к каналу — 1–3 рабочих дня. Мы сами загружаем базу знаний, настраиваем тон и сценарии.",
  },
  {
    id: "q2",
    question: "Ассистент будет отвечать как живой человек?",
    answer:
      "Да, в вашем тоне. Мы настраиваем стиль под бренд: от строгого юриста до дружелюбного консультанта.",
  },
  {
    id: "q3",
    question: "Что если ассистент не знает ответа?",
    answer:
      "Он честно говорит, что уточнит, и передаёт диалог менеджеру. Никаких выдуманных фактов.",
  },
  {
    id: "q4",
    question: "Подключаете к нашей CRM?",
    answer:
      "Да: amoCRM, Битрикс24, retailCRM, YClients. Если CRM нестандартная — делаем интеграцию на тарифе Масштаб.",
  },
  {
    id: "q5",
    question: "А если клиент захочет говорить с человеком?",
    answer:
      "Передаём диалог менеджеру в один клик с полной историей. Контроль остаётся за вами.",
  },
];

export const cases: CaseItem[] = [
  {
    id: "c1",
    company: "Студия ремонта «Контур»",
    niche: "services",
    quote: "Раньше теряли 40% заявок ночью. Сейчас ассистент закрывает их сам.",
    author: "Игорь Лапин, основатель",
    metric: "+62 заявки / мес",
  },
  {
    id: "c2",
    company: "Автосалон «Север»",
    niche: "auto",
    quote: "Avito-менеджер освободился полностью. Закрыли 3 ставки.",
    author: "Марина Соколова, РОП",
    metric: "−420 000 ₽ ФОТ / мес",
  },
  {
    id: "c3",
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

/* ───── Кабинет ───── */

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
