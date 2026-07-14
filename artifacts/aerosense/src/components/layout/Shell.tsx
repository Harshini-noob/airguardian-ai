import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FloatingChat } from "../FloatingChat";
import { Activity, ShieldAlert, FileWarning, BarChart2, RadioTower, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: RadioTower },
    { href: "/enforcement", label: "Enforcement", icon: ShieldAlert },
    { href: "/advisories", label: "Advisories", icon: FileWarning },
    { href: "/compare", label: "Compare", icon: BarChart2 },
    { href: "/chat", label: "Ask AeroSense", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-6 gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
              <Activity className="w-5 h-5" />
            </span>
            <span>AeroSense</span>
          </Link>
          
          <nav className="flex-1 flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-muted/50 border border-border text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Chennai
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      <FloatingChat />
    </div>
  );
}
