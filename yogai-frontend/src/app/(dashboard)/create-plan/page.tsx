"use client";

import { motion } from "framer-motion";
import PlanGeneratorForm from "@/components/yoga/PlanGeneratorForm";

export default function CreatePlanPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-2xl font-bold text-charcoal">Create a Yoga Plan</h1>
        <p className="mt-2 text-sm text-charcoal-lighter">
          Tell us about your preferences and let AI create the perfect yoga session for you
        </p>
      </motion.div>
      <PlanGeneratorForm />
    </div>
  );
}
