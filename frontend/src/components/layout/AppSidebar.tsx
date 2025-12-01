import React, { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardList,
  Users,
  Building2,
  Layers,
  Database,
  Boxes,
  Menu,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

/** Detect HP */
const useIsMobile = () => {
  const [isMobile, setMobile] = React.useState(window.innerWidth < 768);
  useEffect(() => {
    const f = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return isMobile;
};

export const AppSidebar: React.FC = () => {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const isSuperAdmin = user?.role === "superadmin";
  const isCollapsed = state === "collapsed";
  const isOpen = state === "expanded";

  const realCollapsed = isMobile ? false : isCollapsed;

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },

    // SUPERADMIN ONLY
    ...(isSuperAdmin
      ? [{ title: "Data User", url: "/master/users", icon: Users }]
      : []),

    { title: "Data Lab", url: "/master/lab", icon: Building2 },
    { title: "Master Barang", url: "/master/barang", icon: Boxes },
    { title: "Penerimaan Logistik", url: "/penerimaan-logistik", icon: PackagePlus },
    { title: "Penggunaan Barang", url: "/penggunaan", icon: ClipboardList },
    { title: "Transfer Barang", url: "/transfer", icon: ArrowLeftRight },
    { title: "Inventaris Barang", url: "/inventaris", icon: Database },
    { title: "Stok Opname", url: "/stok-opname", icon: Layers },
  ];

  useEffect(() => {
    if (isMobile && isOpen) toggleSidebar();
  }, [location.pathname]);

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
        />
      )}

      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2.5 rounded-md bg-white shadow-md hover:shadow-lg transition-all duration-200"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            <X size={20} className="text-gray-700" />
          ) : (
            <Menu size={20} className="text-gray-700" />
          )}
        </button>
      )}

      <Sidebar
        collapsible="icon"
        className={`
          bg-sidebar text-gray-300 border-r border-white/10
          transition-all duration-300 ease-in-out

          ${isMobile ? "fixed h-full z-40 transform" : "md:block"}
          ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""}
          ${!isMobile ? (realCollapsed ? "md:w-20" : "md:w-64") : ""}
        `}
      >
        <SidebarContent className="py-4">
          <SidebarGroup>
            <div className={`flex items-center px-4 mb-6 ${realCollapsed ? "justify-center" : "justify-between"}`}>
              {!realCollapsed && (
                <SidebarGroupLabel className="font-semibold text-xs uppercase tracking-wider text-gray-400">
                  {isSuperAdmin ? "Menu Superadmin" : "Menu Admin"}
                </SidebarGroupLabel>
              )}
              
              {!isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-150"
                  aria-label={realCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {realCollapsed ? (
                    <ChevronRight size={18} strokeWidth={1.5} />
                  ) : (
                    <ChevronLeft size={18} strokeWidth={1.5} />
                  )}
                </button>
              )}
            </div>

            <SidebarGroupContent>
              <SidebarMenu className={`space-y-0.5 ${realCollapsed ? "px-0" : "px-2"}`}>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          onClick={(e) => {
                            if (realCollapsed && !isMobile) {
                              e.stopPropagation();
                            }
                          }}
                          className={`
                            relative rounded-md transition-all duration-150 group
                            flex items-center
                            ${realCollapsed 
                                    ? "justify-center w-full py-2.5 mx-auto" 
                                    : "gap-3 px-3 py-2.5"
                                  }
                            ${isActive
                              ? "bg-white/10 text-white font-medium"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                            }
                          `}
                        >
                          {/* Active indicator bar */}
                          {isActive && !realCollapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-white"></span>
                          )}

                          <item.icon
                            className="w-[18px] h-[18px] transition-all duration-150 flex-shrink-0"
                          />
                          
                          {!realCollapsed && (
                            <span className="text-sm font-medium transition-all duration-150">
                              {item.title}
                            </span>
                          )}

                          {realCollapsed && !isMobile && (
                            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap shadow-lg pointer-events-none z-50 border border-white/10">
                              {item.title}
                              
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95"></div>
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
};