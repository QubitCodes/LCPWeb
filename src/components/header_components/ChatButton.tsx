"use client";
import { motion } from "framer-motion";
import { HiOutlineChatAlt2 } from "react-icons/hi";
<HiOutlineChatAlt2 />;

const ChatIcon = ({ className }: { className?: string }) => {
  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <HiOutlineChatAlt2 size={40} className={` Header_icon ${className}`} />
    </motion.div>
  );
};

export default ChatIcon;
