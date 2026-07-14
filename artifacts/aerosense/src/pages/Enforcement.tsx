import { useState } from "react";
import { useListEnforcement, EnforcementAction } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ShieldAlert, CheckCircle2, Clock, Crosshair, AlertTriangle } from "lucide-react";
import { cn, getRiskColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Enforcement() {
  const { data: actions, isLoading } = useListEnforcement({ city: "Chennai" });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" />
          Enforcement Intelligence
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          AI-prioritized interventions based on real-time sensor and satellite data.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {actions?.sort((a, b) => b.priorityScore - a.priorityScore).map((action, i) => {
              const isExpanded = expandedId === action.id;
              
              // Map score to color
              let scoreColor = "bg-green-500/10 text-green-500";
              if (action.priorityScore > 60) scoreColor = "bg-yellow-500/10 text-yellow-500";
              if (action.priorityScore > 80) scoreColor = "bg-orange-500/10 text-orange-500";
              if (action.priorityScore > 90) scoreColor = "bg-destructive/10 text-destructive";

              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                >
                  <div 
                    className="p-4 md:p-6 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : action.id)}
                  >
                    <div className={cn("px-3 py-2 rounded-lg font-mono font-bold text-xl min-w-[4rem] text-center", scoreColor)}>
                      {action.priorityScore}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{action.wardName}</span>
                        <Badge variant="outline" className="uppercase font-mono text-[10px]">
                          {action.sourceType}
                        </Badge>
                        {action.status === "pending" && <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">Pending</Badge>}
                        {action.status === "dispatched" && <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">Dispatched</Badge>}
                        {action.status === "resolved" && <Badge variant="secondary" className="bg-green-500/20 text-green-500">Resolved</Badge>}
                      </div>
                      <p className="text-muted-foreground truncate">{action.recommendationText}</p>
                    </div>

                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-muted/20"
                      >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Crosshair className="w-4 h-4" /> Evidence Points
                            </h4>
                            <ul className="space-y-3">
                              {action.evidencePoints?.map((point, idx) => (
                                <li key={idx} className="flex gap-3 text-sm bg-background p-3 rounded-lg border border-border">
                                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Clock className="w-4 h-4" /> Current State
                            </h4>
                            <div className="bg-background p-4 rounded-lg border border-border">
                              <div className="text-sm text-muted-foreground mb-1">Local AQI</div>
                              <div className="text-3xl font-black font-mono">{action.currentAqi}</div>
                            </div>
                            
                            <div className="pt-4 flex flex-col gap-2">
                              <Button className="w-full font-bold">Deploy Inspector</Button>
                              <Button variant="outline" className="w-full">Mark Resolved</Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
