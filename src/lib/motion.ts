/**
 * Единые пресеты framer-motion для лендинга и кабинета.
 * Принципы: сдержанные, короткие, без бесконечных циклов.
 * Уважают prefers-reduced-motion (через CSS-overrides в styles.css).
 */
import type { Variants, Transition } from "framer-motion";

const easeOut: Transition["ease"] = [0.2, 0.8, 0.2, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

/** Общие props для секций «появляется при скролле в viewport». */
export const inViewProps = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-80px" },
} as const;

/** Для блоков, что должны появляться сразу при mount (Hero). */
export const onMountProps = {
  initial: "hidden",
  animate: "visible",
} as const;
