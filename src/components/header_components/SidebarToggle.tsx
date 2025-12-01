"use client"
import { motion } from "framer-motion";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { useSidebar } from "../ui/sidebar";

const SidebarToggle = () => {
  const { toggleSidebar, open } = useSidebar();
  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      className="cursor-pointer"
      onClick={toggleSidebar}>
      {open ? (
        <TbLayoutSidebarRightExpand className="Header_icon" size={40} />
      ) : (
        <TbLayoutSidebarRightExpand
          className="rotate-180 Header_icon"
          size={40}
        />
      )}
    </motion.div>
  );
};

export default SidebarToggle;
