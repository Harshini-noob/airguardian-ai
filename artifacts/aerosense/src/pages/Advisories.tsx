import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListWards, useGetWardAdvisoryEn, useGetWardAdvisoryTa, getGetWardAdvisoryEnQueryKey, getGetWardAdvisoryTaQueryKey } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getRiskColor } from "@/lib/utils";
import { FileWarning, Share2, Printer, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Advisories() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialWardId = searchParams.get("wardId");
  
  const [selectedWardId, setSelectedWardId] = useState<string>(initialWardId || "");
  const [lang, setLang] = useState<"en" | "ta">("en");

  const { data: wards, isLoading: wardsLoading } = useListWards({ city: "Chennai" });

  useEffect(() => {
    if (!selectedWardId && wards && wards.length > 0) {
      setSelectedWardId(wards[0].id.toString());
    }
  }, [wards, selectedWardId]);

  const { data: advisoryEn, isLoading: advEnLoading } = useGetWardAdvisoryEn(
    parseInt(selectedWardId), 
    { query: { enabled: !!selectedWardId && lang === "en", queryKey: getGetWardAdvisoryEnQueryKey(parseInt(selectedWardId)) } }
  );

  const { data: advisoryTa, isLoading: advTaLoading } = useGetWardAdvisoryTa(
    parseInt(selectedWardId), 
    { query: { enabled: !!selectedWardId && lang === "ta", queryKey: getGetWardAdvisoryTaQueryKey(parseInt(selectedWardId)) } }
  );

  const loading = advEnLoading || advTaLoading;
  const advisory = lang === "en" ? advisoryEn : advisoryTa;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary" />
            Citizen Advisories
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Contextual health guidance for vulnerable populations.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border">
          <Tabs value={lang} onValueChange={(v) => setLang(v as "en" | "ta")} className="w-[160px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="ta">தமிழ்</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mb-8">
        {wardsLoading ? (
          <Skeleton className="h-12 w-full md:w-[300px]" />
        ) : (
          <Select value={selectedWardId} onValueChange={setSelectedWardId}>
            <SelectTrigger className="w-full md:w-[300px] h-12 text-lg font-medium">
              <SelectValue placeholder="Select a ward..." />
            </SelectTrigger>
            <SelectContent>
              {wards?.map((w) => (
                <SelectItem key={w.id} value={w.id.toString()}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-xl" />
            <Skeleton className="h-24 w-24 rounded-xl" />
          </div>
        </div>
      ) : advisory ? (
        <div className="bg-card border-2 border-border shadow-xl rounded-2xl overflow-hidden relative">
          {/* Risk Level Header */}
          <div className={`p-6 md:p-8 flex items-center justify-between ${getRiskColor(advisory.riskLevel)}`}>
            <div>
              <div className="text-white/80 font-semibold uppercase tracking-wider text-sm mb-1">
                Risk Level
              </div>
              <div className="text-4xl font-black capitalize tracking-tight">
                {advisory.riskLevel}
              </div>
            </div>
            <FileWarning className="w-16 h-16 opacity-50" />
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-8">
              <div className="text-sm text-muted-foreground font-mono mb-4">
                ISSUED: {new Date(advisory.generatedAt).toLocaleString()} • WARD: {advisory.wardName}
              </div>
              <p className="text-xl md:text-2xl leading-relaxed font-medium text-foreground whitespace-pre-wrap">
                {advisory.messageText}
              </p>
            </div>

            <div className="border-t border-border pt-8">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Vulnerable Groups
              </h4>
              <div className="flex flex-wrap gap-4">
                {advisory.vulnerableGroups?.map((group, idx) => {
                  // Determine emoji based on group string if it matches our requirements
                  let emoji = "";
                  const g = group.toLowerCase();
                  if (g.includes("elderly") || g.includes("older")) emoji = "👴";
                  else if (g.includes("worker") || g.includes("outdoor")) emoji = "🏗️";
                  else if (g.includes("child") || g.includes("kid")) emoji = "🧒";
                  else if (g.includes("school")) emoji = "🏫";

                  return (
                    <div key={idx} className="flex flex-col items-center justify-center bg-muted/50 border border-border rounded-xl p-4 min-w-[100px]">
                      {emoji && <span className="text-3xl mb-2">{emoji}</span>}
                      <span className="text-sm font-medium text-center">{group}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Button className="flex-1 font-bold h-12" size="lg">
                <Share2 className="w-4 h-4 mr-2" /> Share via SMS/WhatsApp
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
                <Printer className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Select a ward to view active advisories.
        </div>
      )}
    </div>
  );
}
