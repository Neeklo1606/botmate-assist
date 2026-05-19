/**
 * /knowledge — родительский layout для раздела «База знаний».
 *
 * Реальный контент:
 *  - `/knowledge`         → `_app.knowledge.index.tsx` (список баз)
 *  - `/knowledge/$baseId` → `_app.knowledge.$baseId.tsx` (документы базы)
 *
 * Этот файл нужен, чтобы под `/knowledge/*` корректно отрисовывался дочерний роут
 * через `<Outlet />` — без него детальная страница базы не показывалась.
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/knowledge")({
  component: KnowledgeLayout,
});

function KnowledgeLayout() {
  return <Outlet />;
}
