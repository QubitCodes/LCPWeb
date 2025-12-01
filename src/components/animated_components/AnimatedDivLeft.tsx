"use client";

import { motion } from "framer-motion";

function AnimatedDivLeft({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}>
      {children}
    </motion.div>
  );
}

export default AnimatedDivLeft;
