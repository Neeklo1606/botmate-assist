/**
 * MediaLivePreview — превью первого поста по ответам брифа.
 */
import { motion } from "framer-motion";
import { MockPostCard, type MockStyle } from "@/components/media/parts/MockPostCard";
import { slugify } from "@/lib/onboarding/shared";

interface Props {
  data: Record<string, unknown>;
}

const TOPIC_TITLES: Record<string, string> = {
  tips: "5 ошибок, которые крадут результат",
  cases: "Как Анна сбросила 7 кг за 3 месяца",
  product: "Почему мой курс работает",
  personal: "Что я ем на завтрак каждое утро",
  educational: "Простыми словами: как это устроено",
  news: "Что нового в индустрии на этой неделе",
  motivation: "Почему сейчас — лучшее время начать",
  reviews: "Отзыв клиента, который заставит задуматься",
};

const FREQ_TIMESTAMP: Record<string, string> = {
  daily: "ЕЖЕДНЕВНО · 09:00",
  thrice_week: "ПН · СР · ПТ",
  weekly: "КАЖДЫЙ ВТОРНИК",
  irregular: "ПО ВДОХНОВЕНИЮ",
};

const FREQ_COUNT: Record<string, number> = {
  daily: 30,
  thrice_week: 12,
  weekly: 4,
  irregular: 8,
};

const VISUAL_STYLE_MAP: Record<string, MockStyle> = {
  warm: "warm",
  minimal: "minimal",
  bright: "bright",
  dark: "dark",
  branded: "warm",
};

export function MediaLivePreview({ data }: Props) {
  const brandName = (data.brandName as string) || "";
  const topics = Array.isArray(data.topics) ? (data.topics as string[]) : [];
  const visualStyle = (data.visualStyle as string) || "";
  const frequency = (data.frequency as string) || "";
  const platforms = Array.isArray(data.platforms) ? (data.platforms as string[]) : [];

  const title = topics.length
    ? TOPIC_TITLES[topics[0]!] ?? "Ваш первый пост"
    : "Заголовок появится после выбора тем";
  const author = brandName || "Ваш бренд";
  const handle = "@" + slugify(brandName);
  const style: MockStyle = VISUAL_STYLE_MAP[visualStyle] ?? "minimal";
  const timestamp = FREQ_TIMESTAMP[frequency] ?? "ПОНЕДЕЛЬНИК · 09:00";
  const freqCount = FREQ_COUNT[frequency] ?? 8;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border-dark bg-bg-elevated p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-dark-subtle">
          Первый пост
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-dark-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          live
        </span>
      </div>

      <motion.div layout key={`${style}-${title}-${author}`}>
        <MockPostCard
          title={title}
          author={author}
          handle={handle}
          style={style}
          timestamp={timestamp}
        />
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <Stat value={String(freqCount)} label="Постов в месяц" />
        <Stat value={String(platforms.length || "—")} label="Платформ" />
        <Stat value="5 мин" label="На пост" />
      </div>

      <p className="text-[12px] text-ink-dark-muted">
        После регистрации сгенерируем 5 первых постов.
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className="font-display text-[24px] font-medium text-ink-dark tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-dark-subtle">
        {label}
      </span>
    </div>
  );
}
