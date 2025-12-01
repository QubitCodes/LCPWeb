'use client';
import { AiOutlineHome } from "react-icons/ai"; 
import React from 'react'
import Link from "next/link";
import { motion } from 'framer-motion';

const HomeButton = ({className}:{className?:string}) => {
  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <Link href="/dashboard">
        <AiOutlineHome size={40} className={`Header_icon ${className}`} />
      </Link>
    </motion.div>
  );
}

export default HomeButton