/**
 * Расширенный Button. Brand-варианты botme (Graphite Ink + Electric Lime).
 * - brand   — primary CTA: графит фон + lime-подчёркивание на hover
 * - signal  — редкий ударный CTA на lime-фоне (текст всегда графит)
 * - ink     — инверсия для тёмных секций: светлый фон + графит текст
 * - outline — нейтральный secondary, тонкая граница border-strong
 * - ghostInk— тихая альтернатива без рамки
 *
 * Никаких хардкод hex — только токены.
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover",
        // Primary: графит + lime-подчёркивание снизу на hover
        brand:
          "bg-primary text-primary-foreground hover:bg-primary-hover after:pointer-events-none after:absolute after:left-3 after:right-3 after:bottom-1 after:h-[2px] after:rounded-full after:bg-accent after:opacity-0 after:transition-opacity after:duration-200 hover:after:opacity-100 active:bg-black",
        // Signal: lime-плашка, текст всегда графит
        signal:
          "bg-accent text-accent-ink hover:bg-accent-hover",
        // Ink: инверсия для тёмных секций
        ink:
          "bg-background text-foreground hover:bg-surface border border-border-strong",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-surface-muted",
        ghostInk:
          "bg-transparent text-foreground hover:bg-surface-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 shadow-xs",
        ghost:
          "hover:bg-surface-muted text-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline decoration-accent decoration-2",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        md: "h-10 px-5",
        lg: "h-11 px-6 text-[15px]",
        xl: "h-12 px-7 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
