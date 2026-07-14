import { useState } from "react";
import { useListWards, useCompareWards, getCompareWardsQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, CheckCircle2 } from "lucide-react";

export default function Compare() {
  const { data: wards, isLoading: wardsLoading } = useListWards({ city: "Chennai" });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const wardIdsStr = selectedIds.join(",");
  const { data: comparison, isLoading: compareLoading } = useCompareWards(
    { wardIds: wardIdsStr },
    { query: { enabled: selectedIds.length > 0, queryKey: getCompareWardsQueryKey({ wardIds: wardIdsStr }) } }
  );

  const toggleWard = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, id];
    });
  };

  // Transform data for recharts
  const chartData: Record<string, any>[] = [];
  if (comparison && comparison.length > 0) {
    // Collect all unique timestamps
    const timestamps = new Set<string>();
    comparison.forEach((ward) => {
      ward.readings?.forEach((r) => timestamps.add(r.timestamp));
    });

    const sortedTimes = Array.from(timestamps).sort();
    
    sortedTimes.forEach((time) => {
      const point: any = { time };
      comparison.forEach((ward) => {
        const reading = ward.readings?.find((r) => r.timestamp === time);
        if (reading) {
          point[ward.wardName] = reading.aqiValue;
        }
      });
      chartData.push(point);
    });
  }

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 mb-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Compare Zones
          </h1>
          <p className="text-sm text-muted-foreground">
            Select up to 5 wards to compare AQI trends and intervention impact.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between">
            <span>Wards</span>
            <span>{selectedIds.length}/5</span>
          </div>
          
          <ScrollArea className="h-[50vh] pr-4">
            {wardsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {wards?.map((w) => (
                  <div key={w.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`ward-${w.id}`} 
                      checked={selectedIds.includes(w.id)}
                      onCheckedChange={() => toggleWard(w.id)}
                      disabled={!selectedIds.includes(w.id) && selectedIds.length >= 5}
                    />
                    <label 
                      htmlFor={`ward-${w.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {w.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-8">
        {selectedIds.length === 0 ? (
          <div className="h-full min-h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl text-muted-foreground bg-muted/10">
            <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No wards selected</p>
            <p className="text-sm">Select wards from the sidebar to view comparison.</p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-2xl p-6 h-[400px] shadow-sm">
              {compareLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(val) => format(parseISO(val), "HH:mm")}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      labelFormatter={(label) => format(parseISO(label), "MMM d, yyyy HH:mm")}
                    />
                    <Legend />
                    {comparison?.map((ward, idx) => (
                      <Line 
                        key={ward.wardId}
                        type="monotone"
                        dataKey={ward.wardName}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="font-semibold text-lg">Intervention Effectiveness</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Ward</th>
                      <th className="px-6 py-4 font-semibold">24h Avg AQI</th>
                      <th className="px-6 py-4 font-semibold">Intervention Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareLoading ? (
                      <tr>
                        <td colSpan={3} className="p-6">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ) : (
                      comparison?.map((ward, idx) => (
                        <tr key={ward.wardId} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                            {ward.wardName}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-base">
                            {ward.avgAqi.toFixed(0)}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {ward.interventionEffectiveness}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
