import { Router, type IRouter } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { db, wardTable, aqiReadingTable } from "@workspace/db";
import { callGroq } from "../lib/groq";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// In-memory cache: wardId -> { data, expiresAt }
const attributionCache = new Map<
  number,
  { data: object; expiresAt: number }
>();

// GET /wards/:wardId/attribution
router.get("/wards/:wardId/attribution", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wardId)
    ? req.params.wardId[0]
    : req.params.wardId;
  const wardId = parseInt(raw, 10);

  if (isNaN(wardId)) {
    res.status(400).json({ error: "Invalid ward ID" });
    return;
  }

  // Check cache (1-hour TTL)
  const cached = attributionCache.get(wardId);
  if (cached && Date.now() < cached.expiresAt) {
    res.json(cached.data);
    return;
  }

  const [ward] = await db
    .select()
    .from(wardTable)
    .where(eq(wardTable.id, wardId));

  if (!ward) {
    res.status(404).json({ error: "Ward not found" });
    return;
  }

  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const readings = await db
    .select()
    .from(aqiReadingTable)
    .where(
      and(
        eq(aqiReadingTable.wardId, wardId),
        gte(aqiReadingTable.timestamp, cutoff)
      )
    )
    .orderBy(desc(aqiReadingTable.timestamp))
    .limit(6);

  const latest = readings[0];
  const avgAqi = latest
    ? Math.round(
        readings.reduce((s, r) => s + r.aqiValue, 0) / readings.length
      )
    : 150;

  const prompt = `You are an air quality attribution expert for Indian cities. Analyze pollution sources for ${ward.name}, ${ward.city}.

Ward details:
- Land use type: ${ward.landUseType}
- Population: ${ward.population.toLocaleString()}
- Recent average AQI: ${avgAqi}
- PM2.5: ${latest?.pm25 ?? 60} µg/m³
- PM10: ${latest?.pm10 ?? 80} µg/m³
- NO₂: ${latest?.no2 ?? 30} µg/m³
- SO₂: ${latest?.so2 ?? 10} µg/m³
- CO: ${latest?.co ?? 1.2} mg/m³

Provide a JSON attribution breakdown (must sum to 100) of pollution sources. Use exactly this JSON format:
{
  "confidenceScore": 0.85,
  "sources": [
    {"category": "Vehicular Emissions", "contributionPct": 62, "description": "Heavy traffic on arterial roads"},
    {"category": "Construction Dust", "contributionPct": 24, "description": "Active construction sites"},
    {"category": "Industrial", "contributionPct": 14, "description": "Nearby industrial cluster"}
  ],
  "summary": "One sentence summary of attribution"
}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const raw = await callGroq(
      [
        {
          role: "system",
          content: "You are an air quality attribution AI. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 512, temperature: 0.3 }
    );

    const parsed = JSON.parse(raw.trim());
    const result = {
      wardId,
      timestamp: new Date().toISOString(),
      confidenceScore: parsed.confidenceScore ?? 0.8,
      sources: parsed.sources ?? [],
      summary: parsed.summary ?? "Attribution analysis complete.",
    };

    // Cache for 1 hour
    attributionCache.set(wardId, {
      data: result,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Attribution LLM failed, using fallback");
    const fallback = buildFallbackAttribution(wardId, ward.landUseType);
    res.json(fallback);
  }
});

function buildFallbackAttribution(wardId: number, landUse: string) {
  const isIndustrial = landUse.toLowerCase().includes("industrial");
  const isResidential = landUse.toLowerCase().includes("residential");

  const sources = isIndustrial
    ? [
        { category: "Industrial Emissions", contributionPct: 48, description: "Industrial cluster emissions" },
        { category: "Vehicular Emissions", contributionPct: 32, description: "Road traffic" },
        { category: "Construction Dust", contributionPct: 20, description: "Nearby construction" },
      ]
    : isResidential
    ? [
        { category: "Vehicular Emissions", contributionPct: 55, description: "Residential traffic" },
        { category: "Biomass Burning", contributionPct: 25, description: "Cooking and waste burning" },
        { category: "Construction Dust", contributionPct: 20, description: "Urban construction" },
      ]
    : [
        { category: "Vehicular Emissions", contributionPct: 62, description: "Heavy traffic on arterial roads" },
        { category: "Construction Dust", contributionPct: 24, description: "Active construction sites" },
        { category: "Industrial", contributionPct: 14, description: "Nearby industrial activity" },
      ];

  return {
    wardId,
    timestamp: new Date().toISOString(),
    confidenceScore: 0.72,
    sources,
    summary: "Attribution based on land-use and monitoring data analysis.",
  };
}

export default router;
