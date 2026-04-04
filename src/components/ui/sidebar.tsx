import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  state: "expanded" | "collapsed";
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ state: "expanded", toggle: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"expanded" | "collapsed">("expanded");
  return (
    <SidebarContext.Provider value={{ state, toggle: () => setState(s => s === "expanded" ? "collapsed" : "expanded") }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() { return useContext(SidebarContext); }

export function Sidebar({ children, collapsible }: { children: ReactNode; collapsible?: string }) {
  const { state } = useSidebar();
  return (
    <aside className={`flex flex-col h-screen sticky top-0 bg-sidebar-background transition-all duration-300 ${state === "collapsed" ? "w-16" : "w-56"} shrink-0`}>
      {children}
    </aside>
  );
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col h-full overflow-hidden ${className || ""}`}>{children}</div>;
}

export function SidebarGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className || ""}>{children}</div>;
}

export function SidebarGroupContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useSidebar();
  return (
    <button onClick={toggle} className={`p-1.5 rounded-md ${className || ""}`} aria-label="Toggle sidebar">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}
