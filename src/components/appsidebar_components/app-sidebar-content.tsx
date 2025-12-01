import { motion } from "framer-motion";
import {
  MapPlus,
  PieChart,
  Settings,
  ShieldUser,
  UserRoundCheck,
  Users,
  UserStar,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: PieChart,
  },
  // {
  //   title: "Home",
  //   url: "/home",
  //   icon: Home,
  // },
  // {
  //   title: "Company",
  //   url: "/company",
  //   icon: Inbox,
  // },
  // {
  //   title: "Band",
  //   url: "/band",
  //   icon: Calendar,
  // },
  // {
  //   title: "Business Vertical",
  //   url: "/businessVertical",
  //   icon: Search,
  // },
  // {
  //   title: "Division",
  //   url: "/division",
  //   icon: Settings,
  // },
  {
    title: "Admin",
    url: "/admin",
    icon: ShieldUser,
  },
  {
    title: "Contractor",
    url: "/contractor",
    icon: UserStar,
  },
  {
    title: "Workers",
    url: "/workers",
    icon: UserRoundCheck,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Country",
    url: "/country",
    icon: MapPlus,
  },
];

interface AppSidebarContentProps {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

const MotionLink = motion(Link);

function AppSidebarContent() {
  const pathname = usePathname();

  return (
    <>
      {/* <SidebarMenu>
        {items.map((items) => (
          <SidebarMenuItem key={items.title}>
            <SidebarMenuButton className="global-font-size" asChild>
              <a href={items.url}>
                <items.icon />
                <span>{items.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu> */}
      <SidebarMenu className="group-data-[collapsible=icon]:px-0 px-1">
        {items.map((item) => {
          const isActive = pathname === item.url;

          return (
            <motion.div
              className="px-[1px]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * items.indexOf(item) }}
              key={item.title}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="global-font-size ps-3 rounded-[14px] flex items-center"
                  asChild
                  isActive={isActive}>
                  <MotionLink
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 1 }}
                    className="w-full"
                    href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </MotionLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </motion.div>
          );
        })}
      </SidebarMenu>
    </>
  );
}

export default AppSidebarContent;
