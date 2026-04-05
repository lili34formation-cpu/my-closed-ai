import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { Shirt, Sparkles, TrendingUp, BarChart2, User } from "lucide-react";

const navItems = [
  { icon: Shirt, label: "Dressing", to: "/" },
  { icon: Sparkles, label: "Tenues", to: "/suggestion" },
  { icon: TrendingUp, label: "Tendances", to: "/tendances" },
  { icon: BarChart2, label: "Stats", to: "/stats" },
  { icon: User, label: "Profil", to: "/profil" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="font-display text-2xl font-light tracking-widest text-foreground">
            MY<span className="gold">CLOSET</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-light">AI Stylist</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-20 pb-28">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground/60"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${active ? "stroke-[1.5]" : "stroke-[1.2]"}`} />
                <span className={`text-[9px] uppercase tracking-widest ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                {active && <div className="h-px w-4 bg-foreground mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
