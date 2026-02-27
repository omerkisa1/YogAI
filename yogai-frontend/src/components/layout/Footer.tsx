export default function Footer() {
  return (
    <footer className="border-t border-cream-300/50 bg-cream-50/50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <p className="text-xs text-charcoal-lighter">
          &copy; {new Date().getFullYear()} YogAI
        </p>
        <p className="text-xs text-charcoal-lighter">
          Powered by Gemini AI
        </p>
      </div>
    </footer>
  );
}
