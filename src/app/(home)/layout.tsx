"use client";
import AnimatedDivDown from "@src/components/animated_components/AnimatedDivDown";
import { AppSidebar } from "@src/components/appsidebar_components/app-sidebar";
import { ChatInterface } from "@src/components/Chat/ChatInterface";
import BellNotification from "@src/components/header_components/BellNotification";
import HomeButton from "@src/components/header_components/HomeButton";
import Navbar from "@src/components/header_components/Navbar";
import ProfileComponent from "@src/components/header_components/ProfileComponent";
import SidebarToggle from "@src/components/header_components/SidebarToggle";
import { ThemeSwitch } from "@src/components/header_components/ThemeToggleBtn";
import { SidebarProvider } from "@src/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { paginationStore } from "../stores/paginationStore";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const resetOffset = paginationStore((state) => state.resetpage);
  const setLimit = paginationStore((state) => state.setLimit);
  const setSearchTerm = paginationStore((state) => state.setsearchValue);

  useEffect(() => {
    resetOffset();
    setLimit(3);
    setSearchTerm("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return (
    //<SidebarProvider>
    //   <AppSidebar />
    //   <main>
    //     <SidebarTrigger />
    //     {children}
    //   </main>
    // </SidebarProvider>
    <div className="flex h-screen w-full MainLayout">
      <SidebarProvider className="w-full flex pr-4">
        <AppSidebar />
        <div className="flex w-full flex-col min-w-0 py-3 ">
          <AnimatedDivDown
            delay={0.3}
            className="flex w-full gap-2 items-center justify-between">
            <SidebarToggle />
            <HomeButton />
            <Navbar />
            <ThemeSwitch />
            <BellNotification />
            <ProfileComponent />
          </AnimatedDivDown>
          <main className="flex-1 h-full rounded-2xl mt-[10px] max-w-full min-w-0 overflow-y-auto scroll overflow-x-hidden">
            <div className="rounded-2xl main_height ">{children}</div>
          </main>
        </div>
      </SidebarProvider>
      <ChatInterface />
    </div>
  );
}
