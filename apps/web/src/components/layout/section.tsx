/**
 * Section — вертикальный ритм секций лендинга.
 * Tone задаёт цвет фона из дизайн-системы (никогда — ad-hoc).
 * SectionHeading — fadeUp при появлении в viewport (см. lib/motion).
 */
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp, inViewProps } from "@/lib/motion";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: "default" | "muted" | "ink";
  size?: "sm" | "md" | "lg";
}

const toneClass = {
  default: "bg-background text-foreground",
  muted: "bg-surface-muted text-foreground",
  ink: "bg-foreground text-background",
} as const;

const sizeClass = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-20 md:py-32",
} as const;

export function Section({
  className,
  tone = "default",
  size = "md",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(toneClass[tone], sizeClass[size], className)}
      {...props}
    />
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={fadeUp}
      {...inViewProps}
      className={cn(
        "mb-10 md:mb-14 max-w-[720px]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-3 text-[15px] md:text-base text-muted-foreground">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
