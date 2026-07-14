import { Router, type IRouter } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { db, wardTable, aqiReadingTable } from "@workspace/db";
import { computeForecast } from "../lib/aqi";

const router: IRouter = Router();

// GET /wards/:wardId/forecast
router.get("/wards/:wardId/forecast", async (req, res): Promise<void> => {
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

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const readings = await db
    .select()
    .from(aqiReadingTable)
    .where(
      and(
        eq(aqiReadingTable.wardId, wardId),
        gte(aqiReadingTable.timestamp, cutoff)
      )
    )
    .orderBy(aqiReadingTable.timestamp);

  const aqiValues = readings.map((r) => r.aqiValue);
  const seed = aqiValues.length > 0 ? aqiValues : [120, 130, 115, 125, 140, 135];

  const forecast = computeForecast(seed, 72);

  const now = Date.now();
  const result = forecast.map((point) => ({
    forecastTimestamp: new Date(
      now + point.hour * 60 * 60 * 1000
    ).toISOString(),
    predictedAqi: point.predictedAqi,
    confidenceLower: point.lower,
    confidenceUpper: point.upper,
  }));

  res.json(result);
});

export default router;
