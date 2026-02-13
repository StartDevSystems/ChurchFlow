import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
  label?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max, label, className, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        className={cn("w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700", className)}
        {...props}
      >
        <motion.div
          className="bg-blue-600 h-2.5 rounded-full text-xs flex items-center justify-center text-white"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ width: `${percentage}%` }}
        >
          {label && <span className="sr-only">{label}</span>}
        </motion.div>
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
