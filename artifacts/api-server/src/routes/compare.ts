import { Router, type IRouter } from "express";
import { eq, and, gte, inArray } from "drizzle-orm";
import { db, wardTable, aqiReadingTable } from "@workspace/db";
import { CompareWardsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /compare?wardIds=1,2,3&range=7d
router.get("/compare", async (req, res): Promise<void> => {
  const query = CompareWardsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "wardIds is required" });
    return;
  }

  const wardIds = query.data.wardIds
    .split(",")
    .map((s: string) => parseInt(s.trim(), 10))
    .filter((n: number) => !isNaN(n));

  if (wardIds.length === 0) {
    res.status(400).json({ error: "No valid ward IDs provided" });
    return;
  }

  const rangeMs: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const cutoff = new Date(
    Date.now() - (rangeMs[query.data.range ?? "7d"] ?? rangeMs["7d"])
  );

  const wards = await db
    .select()
    .from(wardTable)
    .where(inArray(wardTable.id, wardIds));

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
        .orderBy(aqiReadingTable.timestamp)
        .limit(168); // max 1 week hourly

      const aqiValues = readings.map((r) => r.aqiValue);
      const avgAqi =
        aqiValues.length > 0
          ? aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length
          : 0;

      return {
        wardId: ward.id,
        wardName: ward.name,
        readings: readings.map((r) => ({
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
        })),
        avgAqi: Math.round(avgAqi),
        interventionEffectiveness: avgAqi < 150 ? "Effective" : "Needs Improvement",
      };
    })
  );

  res.json(results);
});

export default router;
