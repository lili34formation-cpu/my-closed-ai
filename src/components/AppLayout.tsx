import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Shirt, Sparkles, TrendingUp, BarChart2 } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Mon Dressing", subtitle: "Tous tes vêtements" },
  "/suggestion": { title: "Que porter ?", subtitle: "3 tenues suggérées par l'IA" },
  "/tendances": { title: "Tendances Mode", subtitle: "Ce qui est en vogue cette saison" },
  "/stats": { title: "Statistiques", subtitle: "Tes habitudes vestimentaires" },
};

const navItems = [
  { icon: Shirt, label: "Dressing", to: "/" },
  { icon: Sparkles, label: "Que porter ?", to: "/suggestion" },
  { icon: TrendingUp, label: "Tendances", to: "/tendances" },
  { icon: BarChart2, label: "Stats", to: "/stats" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] ?? { title: "MyCloset AI" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar desktop uniquement */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-white shrink-0 gap-4 shadow-sm">
            <div className="hidden md:block">
              <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
            </div>
            <div className="h-5 w-px bg-border shrink-0 hidden md:block" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground leading-none truncate">{page.title}</h2>
              {page.subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-none hidden sm:block">{page.subtitle}</p>}
            </div>
            {/* Logo mobile */}
            <div className="md:hidden flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-primary">MyCloset AI</span>
            </div>
          </header>
          {/* Contenu avec padding bas sur mobile pour la nav bar */}
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-pb">
        <div className="flex">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium leading-none truncate">{item.label}</span>
                {active && <div className="h-0.5 w-4 rounded-full bg-primary mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </SidebarProvider>
  );
}
