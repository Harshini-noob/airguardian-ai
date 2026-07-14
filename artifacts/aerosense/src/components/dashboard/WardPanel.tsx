import { useEffect, useRef } from "react";
import { useGetWard, useGetWardAttribution, useGetWardForecast, getGetWardAdvisoryEnQueryKey, useGetWardAdvisoryEn, getGetWardQueryKey, getGetWardAttributionQueryKey, getGetWardForecastQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileWarning, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAqiColor, getAqiHex } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";

export function WardPanel({
  wardId,
  onClose,
}: {
  wardId: number | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  
  const { data: ward, isLoading: wardLoading } = useGetWard(wardId || 0, {
    query: { enabled: !!wardId, queryKey: getGetWardQueryKey(wardId || 0) }
  });
  
  const { data: attribution, isLoading: attrLoading } = useGetWardAttribution(wardId || 0, {
    query: { enabled: !!wardId, queryKey: getGetWardAttributionQueryKey(wardId || 0) }
  });

  const { data: forecast, isLoading: forecastLoading } = useGetWardForecast(wardId || 0, {
    query: { enabled: !!wardId, queryKey: getGetWardForecastQueryKey(wardId || 0) }
  });

  const handleGenerateAdvisory = () => {
    if (!wardId) return;
    queryClient.prefetchQuery({
      queryKey: getGetWardAdvisoryEnQueryKey(wardId),
    });
    // Normally would trigger a toast or navigate
    window.location.href = `/advisories?wardId=${wardId}`;
  };

  return (
    <AnimatePresence>
      {wardId && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 w-full max-w-md h-full bg-slate-900/80 backdrop-blur-xl border-l border-border shadow-2xl z-20 overflow-y-auto flex flex-col"
        >
          <div className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-border p-4 flex items-center justify-between z-10">
            {wardLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <h2 className="text-xl font-bold tracking-tight">{ward?.name}</h2>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-8">
            {/* Current Status */}
            {wardLoading || !ward ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Status</div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 text-sm font-bold rounded-md ${getAqiColor(ward.landUseType)}`}>
                      {ward.landUseType || "Unknown"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black font-mono tracking-tighter">
                    {ward.population.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Population</div>
                </div>
              </div>
            )}

            {/* Source Attribution */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Source Attribution
              </h3>
              {attrLoading || !attribution ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attribution.sources}
                          dataKey="contributionPct"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {attribution.sources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                          formatter={(value: number) => [`${value}%`, 'Contribution']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {attribution.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))` }} />
                        <span className="truncate flex-1">{src.category}</span>
                        <span className="font-mono font-medium">{src.contributionPct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    {attribution.summary}
                  </div>
                </div>
              )}
            </div>

            {/* 72hr Forecast */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> 72-Hour Forecast
              </h3>
              {forecastLoading || !forecast ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : (
                <div className="bg-card border border-border rounded-xl p-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="forecastTimestamp" 
                        tickFormatter={(val) => format(parseISO(val), "HH:mm")} 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        labelFormatter={(label) => format(parseISO(label), "MMM d, HH:mm")}
                        formatter={(val: number) => [<span className="font-mono">{val}</span>, "AQI"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="confidenceUpper" 
                        stroke="none" 
                        fill="hsl(var(--muted))" 
                        fillOpacity={0.5} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="confidenceLower" 
                        stroke="none" 
                        fill="hsl(var(--card))" 
                        fillOpacity={1} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedAqi" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorAqi)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
          
          <div className="p-4 border-t border-border bg-card/50 backdrop-blur sticky bottom-0">
            <Button 
              className="w-full font-bold shadow-lg" 
              size="lg" 
              onClick={handleGenerateAdvisory}
              disabled={wardLoading}
            >
              <FileWarning className="w-4 h-4 mr-2" />
              Generate Citizen Advisory
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
