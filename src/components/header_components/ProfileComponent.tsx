"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@src/components/ui/avatar";
import { Button } from "@src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@src/components/ui/popover";
import { Separator } from "@src/components/ui/separator";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiOutlineEdit, AiOutlineSafety, AiOutlineUser } from "react-icons/ai";
import { GoLocation } from "react-icons/go";

interface User {
  name: string;
  email: string;
  // Add other user properties here
}

const ProfileComponent = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const userString =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user: User | null = userString ? JSON.parse(userString) : null;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "U";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.div whileTap={{ scale: 0.9 }} className="cursor-pointer">
          <AiOutlineUser size={40} className={` Header_icon ${className}`} />
        </motion.div>
      </PopoverTrigger>
      <PopoverContent className="w-60 min-w-min mr-2">
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className=" flex flex-col  items-start justify-center">
              <p className="text-sm font-medium scale-105">
                {user ? user.name : ""}
              </p>
              <p className="text-sm font-medium">{user ? user.email : ""}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-1 text-sm">
            <div
              className={` ${
                pathname === "/profile" ? "bg-muted" : ""
              } flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer`}>
              <GoLocation size={16} />
              <Link href={"/profile"}>Address</Link>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
              <AiOutlineEdit size={16} />
              <span>Edit Profile</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
              <AiOutlineSafety size={16} />
              <span>Privacy and Policy</span>
            </div>
          </div>
          <Separator />
          <div>
            <Button className=" w-full" variant="outline">
              Log out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfileComponent;
