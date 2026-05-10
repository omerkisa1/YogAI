export const CATEGORY_BORDER: Record<string, string> = {
  standing: "#2D8B5E",
  seated: "#7C6FAE",
  prone: "#C4956A",
  supine: "#5AC8FA",
  inversion: "#FF6B35",
};

export function categoryBorder(category: string): string {
  const k = category.toLowerCase();
  return CATEGORY_BORDER[k] ?? "#889E81";
}
