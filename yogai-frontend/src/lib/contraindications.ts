export const CONTRAINDICATION_LABELS: Record<string, { tr: string; en: string }> = {
  herniated_disc: {
    tr: "Bel fıtığı olanlar dikkatli olmalı",
    en: "Use caution with herniated disc",
  },
  low_back_pain: {
    tr: "Bel ağrısı olanlar dikkatli olmalı",
    en: "Use caution with lower back pain",
  },
  knee_injury: {
    tr: "Diz sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with knee injury",
  },
  ankle_injury: {
    tr: "Ayak bileği sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with ankle injury",
  },
  shoulder_injury: {
    tr: "Omuz sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with shoulder injury",
  },
  wrist_injury: {
    tr: "Bilek sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with wrist injury",
  },
  neck_injury: {
    tr: "Boyun sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with neck injury",
  },
  hip_injury: {
    tr: "Kalça sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with hip injury",
  },
  groin_injury: {
    tr: "Kasık sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with groin injury",
  },
  hamstring_injury: {
    tr: "Arka bacak kası sakatlığı olanlar dikkatli olmalı",
    en: "Use caution with hamstring injury",
  },
  spinal_injury: {
    tr: "Omurga sakatlığı olanlar yapmamalı",
    en: "Avoid with spinal injury",
  },
  high_blood_pressure: {
    tr: "Yüksek tansiyon hastaları dikkatli olmalı",
    en: "Use caution with high blood pressure",
  },
  pregnancy: {
    tr: "Hamilelikte yapılmamalı",
    en: "Avoid during pregnancy",
  },
  glaucoma: {
    tr: "Glokom hastaları yapmamalı",
    en: "Avoid with glaucoma",
  },
};

export function labelForContraindication(
  key: string,
  locale: string,
): string | undefined {
  const row = CONTRAINDICATION_LABELS[key];
  if (!row) return undefined;
  return locale === "tr" ? row.tr : row.en;
}
