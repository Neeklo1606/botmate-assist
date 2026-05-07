/**
 * Wizard-конфиги по продуктам.
 * Сейчас — заглушка с одним демо-шагом для проверки движка (6B наполнит).
 */
import type { OnboardingConfig, OnboardingProduct } from "./types";

export const placeholderConfig: OnboardingConfig = {
  product: "assistant",
  title: "Создаём вашего ассистента",
  estimatedMinutes: 5,
  finishCta: "Готово. Создать аккаунт",
  steps: [
    {
      id: "demo",
      title: "Это демо-шаг для проверки движка",
      description:
        "В следующем промпте здесь появятся реальные вопросы для каждого продукта.",
      fields: [
        {
          type: "text",
          name: "demoText",
          label: "Тестовое поле",
          placeholder: "Введите что-нибудь...",
          required: true,
        },
        {
          type: "pill-single",
          name: "demoPill",
          label: "Тестовый выбор",
          required: true,
          options: [
            { value: "a", label: "Вариант A" },
            { value: "b", label: "Вариант B" },
            { value: "c", label: "Вариант C" },
          ],
        },
      ],
      validate: (data) => {
        const errors: Record<string, string> = {};
        if (!data.demoText || String(data.demoText).trim() === "") {
          errors.demoText = "Заполните это поле";
        }
        if (!data.demoPill) errors.demoPill = "Выберите вариант";
        return Object.keys(errors).length ? errors : null;
      },
    },
  ],
};

const mediaPlaceholder: OnboardingConfig = {
  ...placeholderConfig,
  product: "media",
  title: "Настраиваем медиа-студию",
  finishCta: "Готово. Создать аккаунт",
};

const sitePlaceholder: OnboardingConfig = {
  ...placeholderConfig,
  product: "site",
  title: "Собираем ваш сайт",
  finishCta: "Готово. Создать аккаунт",
};

export function getOnboardingConfig(product: OnboardingProduct): OnboardingConfig {
  switch (product) {
    case "assistant":
      return placeholderConfig;
    case "media":
      return mediaPlaceholder;
    case "site":
      return sitePlaceholder;
  }
}
