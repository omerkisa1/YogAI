import { colors } from "@/lib/colors";

export const CATEGORY_BORDER: Record<string, string> = {
  standing: colors.categoryStanding,
  seated: colors.categorySeated,
  prone: colors.categoryProne,
  supine: colors.categorySupine,
  inversion: colors.categoryInversion,
};

export function categoryBorder(category: string): string {
  const k = category.toLowerCase();
  return CATEGORY_BORDER[k] ?? colors.primary;
}
