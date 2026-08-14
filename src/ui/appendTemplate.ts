import type { UiTemplate } from "../types/components/shared";

export function resolveTemplate(template: UiTemplate): Node | string {
  return typeof template === "function" ? template() : template;
}

export function appendTemplate(
  template: UiTemplate | null | undefined,
  container: Element | DocumentFragment,
): void {
  if (template == null) return;
  container.append(resolveTemplate(template));
}
