/**
 * TrustStripHome — узкая полоса между hero и products.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";

const items = [
  "Уже 47 компаний",
  "3 продукта в одном",
  "Запуск за 3 дня",
  "Без кода",
];

export function TrustStripHome() {
  return (
    <div
      className="border-t border-b py-6"
      style={{
        background: "var(--bg-base)",
        borderColor: "var(--border-dark)",
      }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-0"
          style={{ color: "var(--ink-dark-muted)" }}
        >
          {items.map((it, i) => (
            <div key={it} className="flex items-center sm:gap-4">
              {i > 0 && (
                <span
                  className="hidden h-3 w-px sm:block"
                  style={{ background: "var(--border-dark-strong)" }}
                />
              )}
              <span className="sm:px-4">{it}</span>
            </div>
          ))}
        </motion.div>
      </Container>
    </div>
  );
}
