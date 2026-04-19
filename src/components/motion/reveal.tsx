/**
 * Reveal / RevealGroup / RevealItem — обёртки над framer-motion с пресетами.
 * Поддерживают тег через `as` (div | section | article | li | ol | ul | header).
 */
import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, stagger, staggerItem, inViewProps, onMountProps } from "@/lib/motion";

type AsTag = "div" | "section" | "article" | "li" | "ol" | "ul" | "header";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate" | "whileInView"> {
  onMount?: boolean;
  delay?: number;
}

export function Reveal({ onMount = false, delay, transition, ...rest }: RevealProps) {
  const trigger = onMount ? onMountProps : inViewProps;
  return (
    <motion.div
      variants={fadeUp}
      transition={
        delay !== undefined
          ? { delay, duration: 0.4, ease: [0.2, 0.8, 0.2, 1], ...transition }
          : transition
      }
      {...trigger}
      {...rest}
    />
  );
}

interface GroupProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  as?: AsTag;
  onMount?: boolean;
}

export function RevealGroup({ as = "div", onMount = false, ...rest }: GroupProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = (motion as any)[as] as React.ElementType;
  const trigger = onMount ? onMountProps : inViewProps;
  return <Tag variants={stagger} {...trigger} {...rest} />;
}

interface ItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  as?: AsTag;
}

export function RevealItem({ as = "div", ...rest }: ItemProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = (motion as any)[as] as React.ElementType;
  return <Tag variants={staggerItem} {...rest} />;
}
