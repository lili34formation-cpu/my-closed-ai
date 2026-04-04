import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Mon Dressing", subtitle: "Tous tes vêtements" },
  "/suggestion": { title: "Que porter ?", subtitle: "Suggestion du jour" },
  "/stats": { title: "Statistiques", subtitle: "Tes habitudes vestimentaires" },
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] ?? { title: "MyCloset AI" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-white shrink-0 gap-4 shadow-sm">
            <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
            <div className="h-5 w-px bg-border shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground leading-none truncate">{page.title}</h2>
              {page.subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-none hidden sm:block">{page.subtitle}</p>}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
