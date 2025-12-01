'use client';
import { IoMdNotificationsOutline } from "react-icons/io"; 
import React from 'react'
import { motion } from 'framer-motion';

const BellNotification = ({ className }: { className?: string }) => {
  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <IoMdNotificationsOutline
        size={40}
        className={`Header_icon ${className}`}
      />
    </motion.div>
  );
};

export default BellNotification