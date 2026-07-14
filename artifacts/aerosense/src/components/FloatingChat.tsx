import { MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function FloatingChat() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/chat"
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
          "hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </Link>
    </div>
  );
}
