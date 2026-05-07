import type { OnboardingConfig } from "../types";
import { contactStep, requireFields } from "../shared";
import { MediaLivePreview } from "@/components/onboarding/previews/MediaLivePreview";

export const mediaConfig: OnboardingConfig = {
  product: "media",
  title: "Настраиваем медиа-студию",
  estimatedMinutes: 5,
  finishCta: "Создать аккаунт",
  livePreviewComponent: MediaLivePreview,
  steps: [
    {
      id: "business",
      title: "Расскажите о бизнесе",
      description: "От этого зависит стиль и тон контента.",
      fields: [
        {
          type: "text",
          name: "brandName",
          label: "Название бренда / личный бренд",
          placeholder: "Анна Травкина или Школа дизайна",
          required: true,
        },
        {
          type: "textarea",
          name: "audience",
          label: "Кто ваша аудитория?",
          placeholder: "Женщины 25–40 в Москве, интересуются здоровым питанием",
          rows: 2,
          required: true,
        },
        {
          type: "textarea",
          name: "valueProp",
          label: "Чем вы помогаете клиентам?",
          placeholder: "Помогаю женщинам после родов вернуть форму через здоровое питание",
          rows: 2,
          helperText: "В 1–2 предложения. Это станет основой для всех текстов.",
          required: true,
        },
      ],
      validate: (d) =>
        requireFields(d, [
          { name: "brandName" },
          { name: "audience" },
          { name: "valueProp" },
        ]),
    },
    {
      id: "voice",
      title: "Какой у вас голос?",
      description: "Стиль текста должен совпадать с тем, как вы общаетесь.",
      fields: [
        {
          type: "tone",
          name: "tone",
          label: "Тон",
          required: true,
          options: [
            { value: "friendly", label: "Дружелюбный", description: "Тёплый, на ты", example: "Знаешь, что съесть утром, чтобы не уснуть в 11? Сейчас расскажу" },
            { value: "neutral", label: "Нейтральный", description: "Вежливый, на вы", example: "5 продуктов, которые крадут утреннюю энергию" },
            { value: "business", label: "Деловой", description: "Формальный, точный", example: "Анализ продуктов с высоким гликемическим индексом и их влияния на работоспособность" },
            { value: "energetic", label: "Энергичный", description: "Бодрый, кричащий", example: "Утром ел печеньку с кофе? Вот почему ты разбит к 11!" },
          ],
        },
        {
          type: "pill-multi",
          name: "topics",
          label: "О чём публикуете?",
          helperText: "Выберите 2–4 темы — botme сгенерирует контент-план",
          required: true,
          min: 2,
          max: 4,
          options: [
            { value: "tips", label: "Советы и лайфхаки" },
            { value: "cases", label: "Кейсы и истории клиентов" },
            { value: "product", label: "Про услуги и продукты" },
            { value: "personal", label: "Личное и закулисье" },
            { value: "educational", label: "Образовательное" },
            { value: "news", label: "Новости индустрии" },
            { value: "motivation", label: "Мотивация" },
            { value: "reviews", label: "Отзывы" },
          ],
        },
      ],
      validate: (d) => {
        const e = requireFields(d, [{ name: "tone", message: "Выберите тон" }]) ?? {};
        const topics = Array.isArray(d.topics) ? (d.topics as string[]) : [];
        if (topics.length < 2) e.topics = "Выберите минимум 2 темы";
        return Object.keys(e).length ? e : null;
      },
    },
    {
      id: "visual",
      title: "Какие у вас визуалы?",
      description: "Стиль обложек, постов и сторис.",
      fields: [
        {
          type: "card-single",
          name: "visualStyle",
          label: "Стиль",
          required: true,
          options: [
            { value: "minimal", label: "Минимализм", description: "Чистый, без лишнего, акцент на типографике", icon: "Square" },
            { value: "warm", label: "Тёплый", description: "Бежевый, кремовый, мягкие цвета", icon: "Sun" },
            { value: "bright", label: "Яркий", description: "Контрастные цвета, акценты, эмоции", icon: "Zap" },
            { value: "dark", label: "Тёмный", description: "Премиум, дорогой, спокойный", icon: "Moon" },
            { value: "branded", label: "Под мой бренд", description: "Уже есть фирменные цвета", icon: "Palette" },
          ],
        },
        {
          type: "color",
          name: "brandColor",
          label: "Основной цвет бренда",
          helperText: "Используем как акцент в обложках",
          showIf: (d) => d.visualStyle === "branded",
        },
      ],
      validate: (d) => requireFields(d, [{ name: "visualStyle", message: "Выберите стиль" }]),
    },
    {
      id: "rhythm",
      title: "Как часто публикуете?",
      description: "Выберите ритм — botme подготовит план под ваш темп.",
      fields: [
        {
          type: "card-single",
          name: "frequency",
          label: "Ритм",
          required: true,
          options: [
            { value: "daily", label: "Каждый день", description: "30 постов в месяц", icon: "CalendarDays" },
            { value: "thrice_week", label: "3 раза в неделю", description: "12 постов в месяц", icon: "Calendar" },
            { value: "weekly", label: "Раз в неделю", description: "4 поста в месяц", icon: "CalendarClock" },
            { value: "irregular", label: "Когда вдохновит", description: "Без расписания, по запросу", icon: "Sparkles" },
          ],
        },
        {
          type: "pill-multi",
          name: "platforms",
          label: "Где публикуете?",
          required: true,
          min: 1,
          options: [
            { value: "telegram", label: "Telegram-канал" },
            { value: "vk", label: "ВКонтакте" },
            { value: "instagram", label: "Instagram" },
            { value: "tiktok", label: "TikTok" },
            { value: "other", label: "Другое" },
          ],
        },
      ],
      validate: (d) =>
        requireFields(d, [
          { name: "frequency", message: "Выберите ритм" },
          { name: "platforms", message: "Выберите минимум 1 платформу" },
        ]),
    },
    contactStep("студии"),
  ],
};
