/**
 * scripts/cleanup-text.ts
 *
 * Чистит видимый русский контент:
 *   1. Заменяет " — " (em-dash + пробелы) на естественную пунктуацию
 *      по контекстным правилам.
 *   2. Убирает двойные пробелы.
 *   3. Унифицирует кавычки (только ёлочки внутри уже отформатированных строк
 *      не трогаем — здесь только подчищаем "..." → «...» внутри текстов).
 *
 * Скоуп:
 *   — Только StringLiteral / NoSubstitutionTemplateLiteral, у которых
 *     родительское ObjectLiteralProperty имеет имя из CONTENT_KEYS.
 *   — Только JsxText.
 *   — НЕ трогает: ChatMessage.text/time, legalDocs.*.intro/sections (юр.
 *     язык — тире разрешено), import-пути, ключи объектов, идентификаторы,
 *     console-логи, aria-label, title-meta-tags, paths, classNames.
 *
 * Запуск:
 *   bunx tsx scripts/cleanup-text.ts
 *   (или) npx ts-node scripts/cleanup-text.ts
 */

import { Project, SyntaxKind, Node, StringLiteral, NoSubstitutionTemplateLiteral, JsxText } from "ts-morph";

const CONTENT_KEYS = new Set([
  // section copy
  "title",
  "description",
  "bullet",
  "tagline",
  "forWho",
  "summary",
  "pain",
  "answer",
  "question",
  "heading",
  "label",
  "hint",
  "name",
  "company",
  "industry",
  "region",
  "role",
  "bio",
  "feature",
  // first-100
  "now",
  "regular",
  // case study sub-fields
]);

// Свойства объектов, которые ВООБЩЕ не трогаем (внутри них всё, включая "text").
const SKIP_OBJECT_PROPS = new Set([
  "dialog",
  "heroChat",
  "chatPresets",
  "legalDocs",
  "sections", // внутри legalDocs
]);

// Замены тире (порядок важен — от специфичных к общим).
function transformText(input: string, contextHint?: string): string {
  let s = input;

  // 1. Числовые конструкции: "минус N" вместо "−N" в человеко-читаемых
  //    метриках. Берём только если строка не выглядит как pure-метрика
  //    с процентом (там "−40%" — норм). Применяем только когда есть
  //    единица измерения слов (ч, час, минут, дней, ставки).
  s = s.replace(/−(\d+)\s*(ч|часов|час|мин|минут|дней|день|ставки|ставок|сек)\b/g, "минус $1 $2");
  s = s.replace(/−(\d+)\s*(\d{3})\s*₽/g, "минус $1 $2 ₽");

  // 2. Диапазоны цифр через короткое тире 1–3 — оставляем (это норма русского).
  // 3. Диапазоны цифр через длинное тире "20 — 30" → "20–30".
  s = s.replace(/(\d+)\s+—\s+(\d+)/g, "$1–$2");

  // 4. Длинное тире между словами " — ":
  //    — если перед ним : то превращаем в запятую (редко)
  //    — если строка содержит ровно одно " — " и не заканчивается на этом —
  //      заменяем на ". " если следующее слово с заглавной, иначе ", ".
  //    — если несколько " — " — заменяем все на ", ".
  const dashRe = / — /g;
  const matches = [...s.matchAll(dashRe)];
  if (matches.length === 1) {
    const idx = matches[0].index!;
    const after = s.slice(idx + 3);
    const next = after.trimStart()[0];
    const isUpper = next && next === next.toUpperCase() && next !== next.toLowerCase();
    s = s.slice(0, idx) + (isUpper ? ". " : ", ") + s.slice(idx + 3);
  } else if (matches.length > 1) {
    s = s.replace(dashRe, ", ");
  }

  // 5. Двойные пробелы.
  s = s.replace(/ {2,}/g, " ");

  // 6. Запятые перед запятой (артефакт замен).
  s = s.replace(/, ,/g, ",").replace(/,\s*\./g, ".").replace(/\.\s*,/g, ".");

  // 7. Слипшиеся знаки пунктуации.
  s = s.replace(/\s+([,.!?;:])/g, "$1");

  return s;
}

function isInsideSkippedObject(node: Node): boolean {
  let parent: Node | undefined = node.getParent();
  while (parent) {
    if (parent.getKind() === SyntaxKind.PropertyAssignment) {
      const name = (parent as any).getName?.();
      if (name && SKIP_OBJECT_PROPS.has(name)) return true;
    }
    parent = parent.getParent();
  }
  return false;
}

function getEnclosingPropertyName(node: Node): string | undefined {
  let parent: Node | undefined = node.getParent();
  while (parent) {
    if (parent.getKind() === SyntaxKind.PropertyAssignment) {
      return (parent as any).getName?.();
    }
    parent = parent.getParent();
  }
  return undefined;
}

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: false,
});

const targetGlobs = [
  "src/lib/mock/data.ts",
  "src/components/landing/**/*.tsx",
  "src/components/landing/**/*.ts",
  "src/routes/_marketing*.tsx",
];

const files = project.getSourceFiles().filter((sf) =>
  targetGlobs.some((g) => {
    const path = sf.getFilePath();
    if (g.includes("**")) {
      const prefix = g.split("**")[0];
      return path.includes(prefix);
    }
    return path.endsWith(g);
  }),
);

let totalChanges = 0;
const log: { file: string; before: string; after: string }[] = [];

for (const sf of files) {
  // Strings inside whitelisted properties.
  sf.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((lit: StringLiteral) => {
    const value = lit.getLiteralText();
    if (!value.includes(" — ") && !/ {2}/.test(value) && !/−\d/.test(value)) return;
    if (isInsideSkippedObject(lit)) return;
    const propName = getEnclosingPropertyName(lit);
    // Если строка является ЗНАЧЕНИЕМ свойства из whitelist — обрабатываем.
    // Если строка — элемент массива (например paragraphs[]) или task[] — пропускаем,
    // т.к. это часто длинные предложения с легитимной пунктуацией.
    if (!propName || !CONTENT_KEYS.has(propName)) return;
    const next = transformText(value);
    if (next !== value) {
      lit.setLiteralValue(next);
      log.push({ file: sf.getFilePath(), before: value, after: next });
      totalChanges++;
    }
  });

  sf.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral).forEach(
    (lit: NoSubstitutionTemplateLiteral) => {
      const value = lit.getLiteralText();
      if (!value.includes(" — ")) return;
      if (isInsideSkippedObject(lit)) return;
      const propName = getEnclosingPropertyName(lit);
      if (!propName || !CONTENT_KEYS.has(propName)) return;
      const next = transformText(value);
      if (next !== value) {
        lit.setLiteralValue(next);
        log.push({ file: sf.getFilePath(), before: value, after: next });
        totalChanges++;
      }
    },
  );

  // JSX text nodes.
  sf.getDescendantsOfKind(SyntaxKind.JsxText).forEach((node: JsxText) => {
    const raw = node.getText();
    if (!raw.includes(" — ") && !/ {2}/.test(raw)) return;
    const next = transformText(raw);
    if (next !== raw) {
      node.replaceWithText(next);
      log.push({ file: sf.getFilePath(), before: raw.trim(), after: next.trim() });
      totalChanges++;
    }
  });
}

await project.save();

console.log(`✓ Cleanup done. Changes: ${totalChanges}`);
log.slice(0, 50).forEach((l) => {
  console.log(`  ${l.file.replace(process.cwd() + "/", "")}`);
  console.log(`    - ${l.before}`);
  console.log(`    + ${l.after}`);
});
if (log.length > 50) console.log(`  ... and ${log.length - 50} more`);
