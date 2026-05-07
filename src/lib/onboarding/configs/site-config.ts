import type { OnboardingConfig } from "../types";
import { contactStep, requireFields } from "../shared";
import { SiteLivePreview } from "@/components/onboarding/previews/SiteLivePreview";

export const siteConfig: OnboardingConfig = {
  product: "site",
  title: "Собираем ваш лендинг",
  estimatedMinutes: 6,
  finishCta: "Создать лендинг",
  livePreviewComponent: SiteLivePreview,
  steps: [
    {
      id: "business",
      title: "Чем вы занимаетесь?",
      description: "Это станет основой для всех текстов лендинга.",
      fields: [
        { type: "text", name: "name", label: "Имя или название бизнеса", placeholder: "Анна Фитнес или Студия А", required: true },
        { type: "text", name: "occupation", label: "Кратко в 3–5 словах кто вы", placeholder: "Фитнес-тренер, индивидуальные программы", required: true },
        {
          type: "card-single",
          name: "type",
          label: "Тип лендинга",
          required: true,
          options: [
            { value: "expert", label: "Эксперт", description: "Курсы, консультации, экспертиза", icon: "User" },
            { value: "service", label: "Услуга", description: "Продаём конкретную услугу", icon: "Briefcase" },
            { value: "course", label: "Курс / школа", description: "Онлайн-обучение с программой", icon: "GraduationCap" },
            { value: "local", label: "Локальный бизнес", description: "Кафе, салон, мастерская", icon: "MapPin" },
            { value: "event", label: "Мероприятие", description: "Конференция, мастер-класс", icon: "Calendar" },
            { value: "freebie", label: "Лид-магнит", description: "Бесплатный PDF / гайд", icon: "Gift" },
          ],
        },
      ],
      validate: (d) =>
        requireFields(d, [
          { name: "name" },
          { name: "occupation" },
          { name: "type", message: "Выберите тип" },
        ]),
    },
    {
      id: "offer",
      title: "Что предлагаете?",
      description: "Главная услуга или продукт. То, ради чего человек придёт на сайт.",
      fields: [
        { type: "text", name: "offerName", label: "Название предложения", placeholder: "Курс «Сильное тело за 8 недель»", required: true },
        { type: "textarea", name: "offerDescription", label: "Опишите в 1–2 предложениях", placeholder: "8 недель индивидуальных тренировок онлайн с диетологом", rows: 3, required: true },
        { type: "number", name: "price", label: "Цена в рублях", placeholder: "12900", helperText: "Можно указать «от X», если вариативная" },
      ],
      validate: (d) => requireFields(d, [{ name: "offerName" }, { name: "offerDescription" }]),
    },
    {
      id: "audience",
      title: "Кому продаёте?",
      description: "Точное описание аудитории помогает подобрать правильные слова.",
      fields: [
        { type: "text", name: "audience", label: "Целевая аудитория", placeholder: "Женщины 25–40, после родов", required: true },
        {
          type: "pill-multi",
          name: "audiencePains",
          label: "Главные боли клиента",
          helperText: "Выберите до 3",
          max: 3,
          options: [
            { value: "notime", label: "Нет времени" },
            { value: "cost", label: "Дорого / нет денег" },
            { value: "skill", label: "Нет навыков" },
            { value: "results", label: "Не получается результат" },
            { value: "trust", label: "Не доверяют" },
            { value: "choice", label: "Слишком много вариантов" },
            { value: "fear", label: "Страх неудачи" },
            { value: "support", label: "Нужна поддержка" },
          ],
        },
      ],
      validate: (d) => requireFields(d, [{ name: "audience" }]),
    },
    {
      id: "result",
      title: "Что получает клиент?",
      description: "Самый важный результат, ради которого стоит купить.",
      fields: [
        { type: "text", name: "mainResult", label: "Главный результат", placeholder: "Минус 5–7 кг и крепкое тело", required: true },
        {
          type: "pill-multi",
          name: "additionalBenefits",
          label: "Дополнительные плюсы",
          helperText: "Выберите 2–4",
          min: 2,
          max: 4,
          options: [
            { value: "speed", label: "Быстрый результат" },
            { value: "guarantee", label: "Гарантия возврата" },
            { value: "personal", label: "Индивидуальный подход" },
            { value: "support_24_7", label: "Поддержка 24/7" },
            { value: "community", label: "Закрытое комьюнити" },
            { value: "online", label: "Полностью онлайн" },
            { value: "certificate", label: "Сертификат / диплом" },
            { value: "bonus", label: "Бонусные материалы" },
          ],
        },
      ],
      validate: (d) => {
        const e = requireFields(d, [{ name: "mainResult" }]) ?? {};
        const ab = Array.isArray(d.additionalBenefits) ? (d.additionalBenefits as string[]) : [];
        if (ab.length > 0 && ab.length < 2) e.additionalBenefits = "Выберите минимум 2 плюса";
        return Object.keys(e).length ? e : null;
      },
    },
    {
      id: "proof",
      title: "Чем доказываете результат?",
      description: "Отзывы и кейсы повышают конверсию в 2 раза. Можно пропустить — добавим позже.",
      optional: true,
      fields: [
        { type: "number", name: "yearsExp", label: "Сколько лет в этой сфере?", placeholder: "5" },
        { type: "number", name: "clientsCount", label: "Сколько клиентов уже довольны?", placeholder: "200" },
        { type: "textarea", name: "testimonial", label: "Один сильный отзыв клиента", placeholder: "«За 2 месяца сбросила 8 кг» — Марина, 32 года", rows: 3 },
      ],
    },
    {
      id: "leads",
      title: "Куда летят заявки?",
      description: "Когда человек заполнит форму — куда придёт уведомление?",
      fields: [
        {
          type: "pill-single",
          name: "leadDestination",
          label: "Канал",
          required: true,
          options: [
            { value: "telegram", label: "Telegram" },
            { value: "email", label: "Email" },
            { value: "amocrm", label: "amoCRM" },
            { value: "bitrix", label: "Bitrix24" },
            { value: "sheets", label: "Google Sheets" },
          ],
        },
        {
          type: "text",
          name: "leadContact",
          label: "Контакт для уведомлений",
          placeholder: "@anna_fitness или anna@example.com",
          helperText: "Зависит от канала",
          required: true,
        },
      ],
      validate: (d) =>
        requireFields(d, [
          { name: "leadDestination", message: "Выберите канал" },
          { name: "leadContact", message: "Укажите контакт" },
        ]),
    },
    contactStep("лендинга"),
  ],
};
