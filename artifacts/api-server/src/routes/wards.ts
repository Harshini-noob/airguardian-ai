import { Router, type IRouter } from "express";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { db, wardTable, aqiReadingTable } from "@workspace/db";
import {
  ListWardsQueryParams,
  GetCitySummaryQueryParams,
  GetWardParams,
  GetWardReadingsParams,
} from "@workspace/api-zod";
import { getAqiCategory, getTrend } from "../lib/aqi";

const router: IRouter = Router();

// GET /wards
router.get("/wards", async (req, res): Promise<void> => {
  const query = ListWardsQueryParams.safeParse(req.query);
  const city = query.success ? (query.data.city ?? "Chennai") : "Chennai";

  const wards = await db
    .select()
    .from(wardTable)
    .where(eq(wardTable.city, city));

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // last 2h

  const results = await Promise.all(
    wards.map(async (ward) => {
      const readings = await db
        .select()
        .from(aqiReadingTable)
        .where(
          and(
            eq(aqiReadingTable.wardId, ward.id),
            gte(aqiReadingTable.timestamp, cutoff)
          )
        )
        .orderBy(desc(aqiReadingTable.timestamp))
        .limit(6);

      const latest = readings[0];
      const aqiValues = readings.map((r) => r.aqiValue);
      const currentAqi = latest?.aqiValue ?? 100;
      const topPollutant = determinePollutant(latest);

      return {
        id: ward.id,
        name: ward.name,
        city: ward.city,
        lat: ward.lat,
        lng: ward.lng,
        population: ward.population,
        landUseType: ward.landUseType,
        currentAqi,
        aqiCategory: getAqiCategory(currentAqi),
        topPollutant,
        trend: getTrend(aqiValues),
      };
    })
  );

  res.json(results);
});

// GET /wards/city-summary
router.get("/wards/city-summary", async (req, res): Promise<void> => {
  const query = GetCitySummaryQueryParams.safeParse(req.query);
  const city = query.success ? (query.data.city ?? "Chennai") : "Chennai";

  const wards = await db
    .select()
    .from(wardTable)
    .where(eq(wardTable.city, city));

  if (wards.length === 0) {
    res.json({
      city,
      averageAqi: 0,
      aqiCategory: "Good",
      worstWard: "-",
      bestWard: "-",
      totalMonitoringStations: 0,
      wardsAboveSafe: 0,
      topPollutant: "PM2.5",
    });
    return;
  }

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const wardStats = await Promise.all(
    wards.map(async (ward) => {
      const [latest] = await db
        .select()
        .from(aqiReadingTable)
        .where(
          and(
            eq(aqiReadingTable.wardId, ward.id),
            gte(aqiReadingTable.timestamp, cutoff)
          )
        )
        .orderBy(desc(aqiReadingTable.timestamp))
        .limit(1);
      return { ward, aqi: latest?.aqiValue ?? 100, reading: latest };
    })
  );

  const sorted = wardStats.sort((a, b) => b.aqi - a.aqi);
  const avgAqi = Math.round(
    wardStats.reduce((sum, s) => sum + s.aqi, 0) / wardStats.length
  );

  res.json({
    city,
    averageAqi: avgAqi,
    aqiCategory: getAqiCategory(avgAqi),
    worstWard: sorted[0]?.ward.name ?? "-",
    bestWard: sorted[sorted.length - 1]?.ward.name ?? "-",
    totalMonitoringStations: wards.length,
    wardsAboveSafe: wardStats.filter((s) => s.aqi > 100).length,
    topPollutant: "PM2.5",
  });
});

// GET /wards/:wardId
router.get("/wards/:wardId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wardId)
    ? req.params.wardId[0]
    : req.params.wardId;
  const wardId = parseInt(raw, 10);

  if (isNaN(wardId)) {
    res.status(400).json({ error: "Invalid ward ID" });
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

  res.json(ward);
});

// GET /wards/:wardId/readings
router.get("/wards/:wardId/readings", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wardId)
    ? req.params.wardId[0]
    : req.params.wardId;
  const wardId = parseInt(raw, 10);

  if (isNaN(wardId)) {
    res.status(400).json({ error: "Invalid ward ID" });
    return;
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h

  const readings = await db
    .select()
    .from(aqiReadingTable)
    .where(
      and(
        eq(aqiReadingTable.wardId, wardId),
        gte(aqiReadingTable.timestamp, cutoff)
      )
    )
    .orderBy(aqiReadingTable.timestamp)
    .limit(48);

  res.json(
    readings.map((r) => ({
      id: r.id,
      wardId: r.wardId,
      timestamp: r.timestamp.toISOString(),
      aqiValue: r.aqiValue,
      pm25: r.pm25,
      pm10: r.pm10,
      no2: r.no2,
      so2: r.so2,
      co: r.co,
      source: r.source,
    }))
  );
});

function determinePollutant(reading: typeof aqiReadingTable.$inferSelect | undefined): string {
  if (!reading) return "PM2.5";
  const candidates = [
    { name: "PM2.5", val: reading.pm25 * 10 },
    { name: "PM10", val: reading.pm10 * 5 },
    { name: "NO₂", val: reading.no2 * 8 },
    { name: "SO₂", val: reading.so2 * 12 },
    { name: "CO", val: reading.co * 2 },
  ];
  return candidates.reduce((best, c) => (c.val > best.val ? c : best)).name;
}

export default router;
