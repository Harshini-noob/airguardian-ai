import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, wardTable, aqiReadingTable, advisoryTable } from "@workspace/db";
import { callGroq } from "../lib/groq";
import { getAqiCategory } from "../lib/aqi";

const router: IRouter = Router();

// Cache: `${wardId}-${lang}` -> { data, expiresAt }
const advisoryCache = new Map<string, { data: object; expiresAt: number }>();

async function generateAdvisory(
  wardId: number,
  lang: "en" | "ta"
): Promise<object> {
  const cacheKey = `${wardId}-${lang}`;
  const cached = advisoryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [ward] = await db
    .select()
    .from(wardTable)
    .where(eq(wardTable.id, wardId));

  if (!ward) throw new Error("Ward not found");

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const [latest] = await db
    .select()
    .from(aqiReadingTable)
    .where(
      and(
        eq(aqiReadingTable.wardId, wardId),
        // gte(aqiReadingTable.timestamp, cutoff)
      )
    )
    .orderBy(desc(aqiReadingTable.timestamp))
    .limit(1);

  const aqi = latest?.aqiValue ?? 120;
  const category = getAqiCategory(aqi);
  const riskLevel =
    aqi <= 50
      ? "low"
      : aqi <= 100
      ? "moderate"
      : aqi <= 200
      ? "high"
      : "severe";

  const langLabel = lang === "ta" ? "Tamil" : "English";
  const prompt = `Generate a citizen health advisory in ${langLabel} for ${ward.name}, ${ward.city}.

Current AQI: ${aqi} (${category})
PM2.5: ${latest?.pm25 ?? 55} µg/m³

Write a 2-3 sentence plain-language advisory that:
1. States the current air quality level simply
2. Gives specific actionable advice for the public
3. Names who is most at risk (elderly, children, outdoor workers)

${lang === "ta" ? "Write ONLY in Tamil script. Do not use English." : "Write in simple, clear English."}

Return ONLY a JSON object:
{
  "messageText": "...",
  "vulnerableGroups": ["elderly", "children", "outdoor workers"]
}`;

  try {
    const raw = await callGroq(
      [
        {
          role: "system",
          content: `You generate health advisories in ${langLabel}. Return only JSON.`,
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 300, temperature: 0.5 }
    );
    const parsed = JSON.parse(raw.trim());
    const result = {
      wardId,
      wardName: ward.name,
      language: lang,
      riskLevel,
      messageText: parsed.messageText ?? `Air quality in ${ward.name} is ${category}. Limit outdoor exposure.`,
      vulnerableGroups: parsed.vulnerableGroups ?? ["elderly", "children", "outdoor workers"],
      generatedAt: new Date().toISOString(),
    };
    advisoryCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30 * 60 * 1000 });
    return result;
  } catch {
    const fallback = {
      wardId,
      wardName: ward.name,
      language: lang,
      riskLevel,
      messageText:
        lang === "en"
          ? `Air quality in ${ward.name} is currently ${category} (AQI: ${aqi}). Sensitive groups should limit outdoor activity. Wear a mask if going outside.`
          : `${ward.name} பகுதியில் தற்போது காற்று தரம் ${category} (AQI: ${aqi}). உணர்திறன் கொண்டவர்கள் வெளியில் செல்வதை குறைக்கவும்.`,
      vulnerableGroups: ["elderly", "children", "outdoor workers", "asthma patients"],
      generatedAt: new Date().toISOString(),
    };
    advisoryCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + 15 * 60 * 1000 });
    return fallback;
  }
}

// GET /wards/:wardId/advisory/en
router.get("/wards/:wardId/advisory/en", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wardId)
    ? req.params.wardId[0]
    : req.params.wardId;
  const wardId = parseInt(raw, 10);

  if (isNaN(wardId)) {
    res.status(400).json({ error: "Invalid ward ID" });
    return;
  }

  const advisory = await generateAdvisory(wardId, "en");
  res.json(advisory);
});

// GET /wards/:wardId/advisory/ta
router.get("/wards/:wardId/advisory/ta", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wardId)
    ? req.params.wardId[0]
    : req.params.wardId;
  const wardId = parseInt(raw, 10);

  if (isNaN(wardId)) {
    res.status(400).json({ error: "Invalid ward ID" });
    return;
  }

  const advisory = await generateAdvisory(wardId, "ta");
  res.json(advisory);
});

export default router;
