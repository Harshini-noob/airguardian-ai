import { useState } from "react";
import { StatBar } from "@/components/dashboard/StatBar";
import { DashboardMap } from "@/components/dashboard/Map";
import { WardPanel } from "@/components/dashboard/WardPanel";

export default function Dashboard() {
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
      <StatBar />
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <div className="absolute inset-0">
          <DashboardMap onSelectWard={setSelectedWardId} selectedWardId={selectedWardId} />
        </div>
        <WardPanel wardId={selectedWardId} onClose={() => setSelectedWardId(null)} />
      </div>
    </div>
  );
}
