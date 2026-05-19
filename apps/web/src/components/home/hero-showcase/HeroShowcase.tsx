/**
 * HeroShowcase — интерактивная карусель 3 продуктов (Assistant/Media/Site).
 * Auto-rotate с pause-on-hover, keyboard nav, prefers-reduced-motion aware.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShowcaseTabs, type ShowcaseTab } from "./ShowcaseTabs";
import { ShowcaseFrame } from "./ShowcaseFrame";
import { ShowcaseControls } from "./ShowcaseControls";
import { AssistantMock } from "./mocks/AssistantMock";
import { MediaMock } from "./mocks/MediaMock";
import { SiteMock } from "./mocks/SiteMock";

const ORDER: ShowcaseTab[] = ["assistant", "media", "site"];
const AUTOPLAY_MS = 6500;
const START_DELAY_MS = 1500;

export function HeroShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("assistant");
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    const t = setTimeout(() => setMounted(true), START_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted || isPaused || reducedMotion.current) return;
    const id = setTimeout(() => {
      const idx = ORDER.indexOf(activeTab);
      setActiveTab(ORDER[(idx + 1) % ORDER.length]);
      setCycleKey((k) => k + 1);
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [activeTab, isPaused, mounted]);

  const handleSelect = (t: ShowcaseTab) => {
    setActiveTab(t);
    setCycleKey((k) => k + 1);
  };

  return (
    <div
      className="relative mx-auto mt-[60px] w-full max-w-[1080px] sm:mt-20"
      style={{
        ["--frame-h" as string]: "420px",
      }}
    >
      <style>{`
        @media (min-width: 640px) {
          .hero-showcase-root { --frame-h: 460px !important; }
        }
        @media (min-width: 1024px) {
          .hero-showcase-root { --frame-h: 580px !important; }
        }
      `}</style>
      <div
        className="hero-showcase-root"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <ShowcaseTabs
          activeTab={activeTab}
          onChange={handleSelect}
          isPaused={isPaused || !mounted}
          autoplayMs={AUTOPLAY_MS}
          cycleKey={cycleKey}
        />
        <ShowcaseFrame activeTab={activeTab}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="h-full"
            >
              {activeTab === "assistant" && <AssistantMock />}
              {activeTab === "media" && <MediaMock />}
              {activeTab === "site" && <SiteMock />}
            </motion.div>
          </AnimatePresence>
        </ShowcaseFrame>
        <ShowcaseControls
          activeTab={activeTab}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
