"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePose } from "@/hooks/usePoses";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { categoryBorder } from "@/lib/exploreMeta";
import { labelForContraindication } from "@/lib/contraindications";
import type { Translations } from "@/lib/i18n";

function catLabel(c: string, t: Translations): string {
  const k = c.toLowerCase();
  if (k === "standing") return t.categoryStanding;
  if (k === "seated") return t.categorySeated;
  if (k === "prone") return t.categoryProne;
  if (k === "supine") return t.categorySupine;
  if (k === "inversion") return t.categoryInversion;
  return c;
}

export default function PoseDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { t, locale } = useApp();
  const { data: pose, isLoading, error, refetch } = usePose(id);

  const border = pose ? categoryBorder(pose.category) : "#889E81";

  const testHref = `/pose-test?poseId=${encodeURIComponent(id)}`;
  const customHref = `/explore/create-custom?add=${encodeURIComponent(id)}`;

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !pose) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-th-text-mut">{t.noPoses}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => refetch()}>
          {t.reload}
        </button>
        <Link href="/explore" className="mt-4 block text-sm text-sage-600 hover:underline">
          ← {t.exploreTitle}
        </Link>
      </div>
    );
  }

  const name = locale === "tr" ? pose.name_tr : pose.name_en;
  const sub = locale === "tr" ? pose.name_en : pose.name_tr;
  const instr = locale === "tr" ? pose.instructions_tr : pose.instructions_en;
  const dots = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < pose.difficulty ? "text-white" : "text-white/40"}>
      ●
    </span>
  ));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <button type="button" onClick={() => router.back()} className="mb-6 text-sm font-medium text-sage-600 hover:underline dark:text-sage-400">
        ← {t.back}
      </button>

      <div
        className="rounded-3xl p-6 text-white shadow-lg md:p-8"
        style={{
          background: `linear-gradient(135deg, ${border}dd 0%, rgb(15 23 42) 100%)`,
        }}
      >
        <p className="text-2xl font-bold md:text-3xl">{name}</p>
        <p className="mt-1 text-sm text-white/85">{sub}</p>
        <div className="mt-3 flex gap-1 text-sm">{dots}</div>
        <p className="mt-2 text-sm text-white/90">
          {catLabel(pose.category, t)} · {pose.difficulty}/5
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-th-text">{t.poseDetailMeta}</h2>
          <dl className="space-y-2 text-sm text-th-text-sec">
            <div className="flex justify-between gap-4">
              <dt>{t.poseCategory}</dt>
              <dd>{catLabel(pose.category, t)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t.poseTarget}</dt>
              <dd>{pose.target_area}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t.poseDifficulty}</dt>
              <dd>
                {pose.difficulty}/5
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t.poseAnalyzableLabel}</dt>
              <dd>{pose.is_analyzable ? t.yes : t.no}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-th-text">{t.poseHowTo}</h2>
          <p className="text-sm leading-relaxed text-th-text-sec">{instr}</p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-th-text">{t.poseCaution}</h2>
          {pose.contraindications.length === 0 ? (
            <p className="text-sm text-th-text-sec">{t.suitableForAll}</p>
          ) : (
            <ul className="list-inside list-disc space-y-2 text-sm text-amber-800 dark:text-amber-300">
              {pose.contraindications.map((c) => (
                <li key={c}>{labelForContraindication(c, locale) || c}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {pose.is_analyzable ? (
          <Link href={testHref} className="btn-primary flex-1 justify-center text-center">
            {t.tryThisPose}
          </Link>
        ) : (
          <span className="btn-primary flex-1 cursor-not-allowed justify-center text-center opacity-50">{t.tryThisPose}</span>
        )}
        <Link href={customHref} className="btn-secondary flex-1 justify-center text-center">
          {t.addToCustomPlan}
        </Link>
      </div>
      {!pose.is_analyzable && <p className="mt-3 text-center text-xs text-th-text-mut">{t.poseNotAnalyzable}</p>}
    </div>
  );
}
