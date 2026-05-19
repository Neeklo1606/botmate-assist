/**
 * /projects — родительский layout раздела «Проекты».
 *
 *  - `/projects`             → `_app.projects.index.tsx` (список)
 *  - `/projects/$projectId`  → `_app.projects.$projectId.tsx` (детальная)
 *
 * Layout рендерит `<Outlet />`, чтобы дочерние роуты корректно отображались
 * под `/projects/*` — без него ссылка на конкретный проект показывала пустую
 * страницу (или просто список).
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
