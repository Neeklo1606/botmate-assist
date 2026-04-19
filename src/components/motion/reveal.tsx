/**
 * Reveal / RevealGrid — лёгкие обёртки над framer-motion с пресетами.
 * Используются в секциях лендинга и карточках кабинета.
 */
import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, stagger, staggerItem, inViewProps, onMountProps } from "@/lib/motion";

type DivProps = HTMLMotionProps<"div">;

interface RevealProps extends Omit<DivProps, "variants" | "initial" | "animate" | "whileInView"> {
  /** trigger anim immediately on mount, otherwise — on enter viewport */
  onMount?: boolean;
  delay?: number;
}

export function Reveal({ onMount = false, delay, transition, ...rest }: RevealProps) {
  const trigger = onMount ? onMountProps : inViewProps;
  return (
    <motion.div
      variants={fadeUp}
      transition={delay ? { delay, duration: 0.4, ease: [0.2, 0.8, 0.2, 1], ...transition } : transition}
      {...trigger}
      {...rest}
    />
  );
}

interface RevealGridProps extends Omit<DivProps, "variants" | "initial" | "animate" | "whileInView"> {
  onMount?: boolean;
}

/** Контейнер с stagger. Дети должны быть <RevealItem>. */
export function RevealGroup({ onMount = false, ...rest }: RevealGridProps) {
  const trigger = onMount ? onMountProps : inViewProps;
  return <motion.div variants={stagger} {...trigger} {...rest} />;
}

export function RevealItem(props: Omit<DivProps, "variants">) {
  return <motion.div variants={staggerItem} {...props} />;
}
