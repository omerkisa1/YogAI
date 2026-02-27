"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${sizeMap[size]} rounded-full border-2 border-th-muted border-t-sage-400`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
