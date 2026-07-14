import { useGetCitySummary } from "@workspace/api-client-react";
import NumberTicker from "@/components/ui/number-ticker";
import { Skeleton } from "@/components/ui/skeleton";
import { getAqiColor } from "@/lib/utils";
import { Wind, MapPin, Activity, AlertTriangle } from "lucide-react";

export function StatBar() {
  const { data: summary, isLoading } = useGetCitySummary({ city: "Chennai" });

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-card border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "City Average AQI",
      value: <NumberTicker value={summary.averageAqi} />,
      icon: Activity,
      sub: summary.aqiCategory,
      color: getAqiColor(summary.aqiCategory),
    },
    {
      label: "Wards Above Safe Limit",
      value: <NumberTicker value={summary.wardsAboveSafe} />,
      icon: AlertTriangle,
      sub: `Out of ${summary.totalMonitoringStations} stations`,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Worst Ward",
      value: summary.worstWard,
      icon: MapPin,
      sub: `Top Pollutant: ${summary.topPollutant}`,
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      label: "Best Ward",
      value: summary.bestWard,
      icon: Wind,
      sub: "Safest zone currently",
      color: "bg-green-500/10 text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 lg:p-6 bg-background/50 backdrop-blur-md border-b border-border z-10 relative">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
            <div className={`p-3 rounded-lg ${stat.color.includes("bg-") ? stat.color : "bg-primary/10 text-primary"}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-2xl font-bold font-mono tracking-tight flex items-baseline gap-2">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{stat.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
