import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { Shirt, Sparkles, TrendingUp, BarChart2 } from "lucide-react";

const navItems = [
  { icon: Shirt, label: "Dressing", to: "/" },
  { icon: Sparkles, label: "Tenues", to: "/suggestion" },
  { icon: TrendingUp, label: "Tendances", to: "/tendances" },
  { icon: BarChart2, label: "Stats", to: "/stats" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-display text-xl font-bold gradient-text">MyCloset AI</span>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Dressing IA</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-20 pb-28">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5 safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && <div className="h-0.5 w-5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
