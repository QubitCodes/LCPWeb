"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@src/components/ui/sidebar";

import Image from "next/image";
import Link from "next/link";
import companyIcon from "../../../public/icons/LCP_PNG_LOGO.png";
import AnimatedDivDown from "../animated_components/AnimatedDivDown";
import AppSidebarContent from "./app-sidebar-content";

export function AppSidebar() {
  return (
    // <Sidebar collapsible="icon" variant="floating" side="left">
    //   <SidebarHeader>
    //     <Link href="/dashboard" className="flex items-center justify-left">
    //       <TextIndent size={32} />
    //     </Link>
    //     Heading
    //   </SidebarHeader>
    //   <SidebarContent>
    //     <SidebarGroup>
    //       <SidebarGroupContent>
    //         <SidebarMenu>Group 1</SidebarMenu>
    //       </SidebarGroupContent>
    //     </SidebarGroup>
    //     <SidebarGroup>
    //       <SidebarGroupContent>
    //         <SidebarMenu>Group 2</SidebarMenu>
    //       </SidebarGroupContent>
    //     </SidebarGroup>
    //     <SidebarGroup>
    //       <SidebarGroupContent>
    //         <SidebarMenu>Group 3</SidebarMenu>
    //       </SidebarGroupContent>
    //     </SidebarGroup>
    //     <SidebarGroup>
    //       <SidebarGroupContent>
    //         <SidebarMenu>Group 4</SidebarMenu>
    //       </SidebarGroupContent>
    //     </SidebarGroup>
    //   </SidebarContent>
    //   <SidebarFooter>LogOut</SidebarFooter>
    // </Sidebar>
    <AnimatedDivDown delay={0.3} className="rounded-xl">
      <Sidebar
        collapsible="icon"
        variant="floating"
        side="left"
        className="p-3 border-none">
        <SidebarHeader className="flex items-center justify-center rounded-2xl">
          <Link href="/dashboard">
            <Image
              src={companyIcon}
              alt="Company Logo"
              width={50}
              height={50}
              className="object-contain mt-2 cursor-pointer blueIconColor"
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-1">
            {/* <SidebarGroupLabel>
            <AnimatedDivDown>Application</AnimatedDivDown>
          </SidebarGroupLabel> */}
            <SidebarGroupContent>
              {/* Menu Data Component : AppSidebarContent */}
              <AppSidebarContent />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </AnimatedDivDown>
  );
}
