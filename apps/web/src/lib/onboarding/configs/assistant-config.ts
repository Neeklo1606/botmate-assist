import type { OnboardingConfig } from "../types";
import { contactStep, requireFields } from "../shared";
import { AssistantLivePreview } from "@/components/onboarding/previews/AssistantLivePreview";

export const assistantConfig: OnboardingConfig = {
  product: "assistant",
  title: "Создаём вашего ассистента",
  estimatedMinutes: 4,
  finishCta: "Создать аккаунт и сохранить",
  livePreviewComponent: AssistantLivePreview,
  steps: [
    {
      id: "niche",
      title: "Чем занимается ваш бизнес?",
      description:
        "Выберите нишу — мы загрузим типовые сценарии и адаптируем тон ассистента.",
      fields: [
        {
          type: "card-single",
          name: "industry",
          label: "Ниша",
          required: true,
          options: [
            { value: "realestate", label: "Недвижимость", description: "Агентства, застройщики, риелторы", icon: "Building" },
            { value: "auto", label: "Авто", description: "Дилеры, автосалоны, Avito", icon: "Car" },
            { value: "clinic", label: "Клиника", description: "Медицина, стоматология, косметология", icon: "HeartPulse" },
            { value: "services", label: "Услуги", description: "Ремонт, дизайн, консалтинг, фриланс", icon: "Wrench" },
            { value: "edu", label: "Образование", description: "Курсы, школы, репетиторы", icon: "GraduationCap" },
            { value: "retail", label: "Розница", description: "Магазин, кафе, локальный бизнес", icon: "ShoppingBag" },
            { value: "agency", label: "Агентство", description: "Маркетинг, реклама, B2B-услуги", icon: "Users" },
            { value: "other", label: "Другое", description: "Опишем индивидуально", icon: "Sparkles" },
          ],
        },
        {
          type: "text",
          name: "companyName",
          label: "Как называется ваш бизнес?",
          placeholder: "АвтоСалон XYZ или Анна Травкина",
          helperText: "Можно личный бренд или название компании",
          required: true,
        },
      ],
      validate: (d) =>
        requireFields(d, [
          { name: "industry", message: "Выберите нишу" },
          { name: "companyName", message: "Укажите название" },
        ]),
    },
    {
      id: "purpose",
      title: "Что должен делать ассистент?",
      description: "Выберите главную задачу. Можно несколько.",
      fields: [
        {
          type: "card-multi",
          name: "tasks",
          label: "Задачи",
          required: true,
          options: [
            { value: "qualify", label: "Квалифицировать заявки", description: "Задать правильные вопросы, отделить горячих от холодных", icon: "Filter" },
            { value: "sell", label: "Вести по воронке", description: "Презентовать, отвечать на возражения, закрывать на следующий шаг", icon: "TrendingUp" },
            { value: "support", label: "Отвечать на вопросы", description: "FAQ, технические детали, прайс, условия", icon: "LifeBuoy" },
            { value: "book", label: "Записывать на встречу", description: "Согласовать дату, занести в календарь", icon: "Calendar" },
            { value: "calculate", label: "Считать стоимость", description: "Прайс, варианты пакетов, расчёт сроков", icon: "Calculator" },
            { value: "collect", label: "Собирать данные клиента", description: "Имя, контакт, бюджет — передать менеджеру", icon: "Database" },
          ],
        },
      ],
      validate: (d) =>
        requireFields(d, [{ name: "tasks", message: "Выберите хотя бы одну задачу" }]),
    },
    {
      id: "channels",
      title: "Где будет работать ассистент?",
      description: "Выберите каналы. Подключим в течение 3 дней.",
      fields: [
        {
          type: "card-multi",
          name: "channels",
          label: "Каналы",
          required: true,
          options: [
            { value: "telegram", label: "Telegram", description: "Бот в Telegram, отвечает в личке", icon: "Send" },
            { value: "website", label: "Сайт", description: "Виджет чата на любом сайте", icon: "Globe" },
            { value: "avito", label: "Avito", description: "Автоответы в мессенджере Avito", icon: "ShoppingCart" },
            { value: "vk", label: "ВКонтакте", description: "Сообщения сообщества", icon: "MessageSquare" },
            { value: "whatsapp", label: "WhatsApp", description: "Business API", icon: "Phone" },
            { value: "instagram", label: "Instagram DM", description: "Личные сообщения", icon: "Instagram" },
          ],
        },
        {
          type: "url",
          name: "website",
          label: "Адрес сайта",
          placeholder: "https://anna-fitness.ru",
          helperText: "Подключим виджет на 1-й день",
          showIf: (d) => Array.isArray(d.channels) && (d.channels as string[]).includes("website"),
        },
      ],
      validate: (d) =>
        requireFields(d, [{ name: "channels", message: "Выберите хотя бы один канал" }]),
    },
    {
      id: "tone",
      title: "Как ассистент общается с клиентами?",
      description: "Подберите тон под ваш бренд. Сможете изменить позже.",
      fields: [
        {
          type: "tone",
          name: "tone",
          label: "Тон",
          required: true,
          options: [
            { value: "friendly", label: "Дружелюбный", description: "Тёплый, на ты, с эмодзи", example: "Привет! Расскажите, что ищете — помогу подобрать" },
            { value: "neutral", label: "Нейтральный", description: "Вежливый, на вы, без эмоций", example: "Здравствуйте. Чем мы можем вам помочь?" },
            { value: "business", label: "Деловой", description: "Сухой, формальный, точный", example: "Добрый день. Опишите запрос, обработаем в порядке очереди." },
            { value: "energetic", label: "Энергичный", description: "Краткий, на ты, с восклицаниями", example: "Привет! Готов помочь — что нужно?" },
          ],
        },
        {
          type: "text",
          name: "greeting",
          label: "Приветствие",
          placeholder: "Здравствуйте! Я ассистент...",
          helperText: "Что напишет клиенту первым. Можно оставить наш дефолт.",
        },
      ],
      validate: (d) => requireFields(d, [{ name: "tone", message: "Выберите тон" }]),
    },
    contactStep("ассистента"),
  ],
};
