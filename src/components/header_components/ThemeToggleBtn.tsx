"use client";

import { useTheme } from "next-themes";
import { BiMoon } from "react-icons/bi";
import { BsSun } from "react-icons/bs";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';

export const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // placeholder to avoid SSR mismatch
    return <div className="w-10 h-10" />;
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      type="button"
      className="cursor-pointer"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? (
        <BsSun className=" Header_icon" size={40} />
      ) : (
        <BiMoon className="Header_icon" size={40} />
      )}
    </motion.button>
  );
};
