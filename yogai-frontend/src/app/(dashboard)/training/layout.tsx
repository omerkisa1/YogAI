export const dynamic = "force-dynamic";

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full min-w-0 flex-1 self-stretch" data-yogai-training-layout>{children}</div>;
}
