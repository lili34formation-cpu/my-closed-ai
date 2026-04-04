import { Shirt, Sparkles, BarChart2, LogOut } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { icon: Shirt, label: "Mon Dressing", to: "/" },
  { icon: Sparkles, label: "Que porter ?", to: "/suggestion" },
  { icon: BarChart2, label: "Statistiques", to: "/stats" },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border/50 shrink-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-sidebar-primary shrink-0">
            <Shirt className="h-5 w-5 text-sidebar-background" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">MyCloset AI</p>
              <p className="text-[11px] text-white/40 leading-tight">Dressing intelligent</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-0.5 px-2">
                {navItems.map(item => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-all ${
                        active
                          ? 'bg-sidebar-accent text-white border-l-2 border-sidebar-primary'
                          : 'text-white/75 hover:text-white hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-sidebar-border/50 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium text-white/75 hover:text-white hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
