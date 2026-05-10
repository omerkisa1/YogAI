"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAllPoses } from "@/hooks/usePoses";
import { useApp } from "@/components/layout/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { categoryBorder } from "@/lib/exploreMeta";
import type { Pose } from "@/types/yoga";
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

function PoseGridCard({ pose, locale, t }: { pose: Pose; locale: string; t: Translations }) {
  const name = locale === "tr" ? pose.name_tr : pose.name_en;
  const sub = locale === "tr" ? pose.name_en : pose.name_tr;
  const border = categoryBorder(pose.category);
  const dots = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < pose.difficulty ? "text-sage-500" : "text-th-muted"}>
      ●
    </span>
  ));

  return (
    <Link href={`/explore/${pose.pose_id}`} className="block">
      <motion.div
        whileHover={{ y: -2 }}
        className="relative h-full overflow-hidden rounded-2xl border border-th-border bg-th-card shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: border }} />
        <div className="p-4 pl-5">
          <p className="font-semibold text-th-text">{name}</p>
          <p className="text-xs text-th-text-mut">{sub}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-th-text-sec">
            <span className="flex gap-0.5">{dots}</span>
            <span className="rounded-md bg-th-subtle px-2 py-0.5">{catLabel(pose.category, t)}</span>
            <span className="rounded-md bg-th-subtle px-2 py-0.5">{pose.target_area}</span>
          </div>
          {pose.is_analyzable && (
            <p className="mt-2 text-xs font-medium text-sage-600 dark:text-sage-400">{t.poseAnalyzableBadge}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function ExplorePage() {
  const { t, locale } = useApp();
  const { data: poses = [], isLoading, error, refetch, isError } = useAllPoses();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [diff, setDiff] = useState<number | "">("");
  const [area, setArea] = useState<string>("");

  const categories = useMemo(() => {
    const s = new Set<string>();
    poses.forEach((p) => s.add(p.category));
    return Array.from(s).sort();
  }, [poses]);

  const areas = useMemo(() => {
    const s = new Set<string>();
    poses.forEach((p) => {
      if (p.target_area) s.add(p.target_area);
    });
    return Array.from(s).sort();
  }, [poses]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return poses.filter((p) => {
      if (ql) {
        const en = p.name_en.toLowerCase();
        const tr = p.name_tr.toLowerCase();
        if (!en.includes(ql) && !tr.includes(ql)) return false;
      }
      if (cat && p.category.toLowerCase() !== cat.toLowerCase()) return false;
      if (diff !== "" && p.difficulty !== diff) return false;
      if (area && p.target_area !== area) return false;
      return true;
    });
  }, [poses, q, cat, diff, area]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text">{t.exploreTitle}</h1>
          <p className="mt-1 text-sm text-th-text-mut">{t.poseLibrarySubtitle}</p>
        </div>
        <Link href="/explore/create-custom" className="btn-primary inline-flex justify-center">
          {t.createCustomPlan}
        </Link>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.searchPoses}
        className="input-field mb-6 w-full max-w-xl"
        aria-label={t.searchPoses}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-th-text-mut">{t.poseCategory}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCat("")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${!cat ? "bg-sage-400 text-white" : "border border-th-border bg-th-card"}`}
            >
              {t.categoryAll}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${cat === c ? "bg-sage-400 text-white" : "border border-th-border bg-th-card"}`}
              >
                {catLabel(c, t)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-th-text-mut">{t.poseDifficulty}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDiff("")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${diff === "" ? "bg-sage-400 text-white" : "border border-th-border bg-th-card"}`}
            >
              {t.difficultyAll}
            </button>
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiff(d)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${diff === d ? "bg-sage-400 text-white" : "border border-th-border bg-th-card"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="mb-2 text-xs font-medium text-th-text-mut">{t.poseTarget}</p>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field w-full text-sm">
            <option value="">{t.targetAreaAll}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-th-text-mut">
        {filtered.length} {t.posesCount}
      </p>

      {isError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {t.loadError}{" "}
          <button type="button" className="font-medium underline" onClick={() => refetch()}>
            {t.reload}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-th-border py-16 text-center text-th-text-mut">{t.noPoses}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PoseGridCard key={p.pose_id} pose={p} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
