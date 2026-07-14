import { useState, useRef, useEffect } from "react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Send, Bot, User, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  sources?: string[];
};

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Hello! I am AeroSense AI. I can analyze real-time air quality data, identify pollution sources, and recommend interventions for any ward in Chennai. How can I assist you today?",
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMutation = useSendChatMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    chatMutation.mutate(
      { data: { message: userMsg.content, city: "Chennai" } },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "bot",
              content: data.answer,
              sources: data.sources,
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "bot",
              content: "I'm sorry, I encountered an error while processing your request. Please try again.",
            },
          ]);
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)] w-full py-6 px-4 md:px-0">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Ask AeroSense
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Natural language intelligence over city-wide sensor and satellite data.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border"
                )}>
                  {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={cn(
                  "rounded-2xl p-4 overflow-hidden",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-muted/50 border border-border rounded-tl-sm text-foreground"
                )}>
                  {msg.role === "bot" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  )}
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">
                        Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => (
                          <span key={i} className="px-2 py-1 bg-background/50 border border-border rounded text-xs font-mono">
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex gap-4 max-w-[85%] mr-auto">
                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground animate-pulse">Analyzing multi-modal data...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-muted/20 border-t border-border">
          <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g. What's causing the spike in PM2.5 in Adyar?"
              className="pr-14 h-14 bg-background border-border text-base rounded-xl shadow-sm focus-visible:ring-primary"
              disabled={chatMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 h-10 w-10 rounded-lg"
              disabled={!input.trim() || chatMutation.isPending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
