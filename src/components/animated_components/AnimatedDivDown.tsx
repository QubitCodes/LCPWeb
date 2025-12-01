"use client";

import { motion } from "framer-motion";

function AnimatedDivDown({
  children,
  className,
  delay,
}: {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay || 0 }}>
      {children}
    </motion.div>
  );
}
export default AnimatedDivDown;
