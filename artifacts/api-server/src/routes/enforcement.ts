import { Router, type IRouter } from "express";
import { eq, and, desc, gte } from "drizzle-orm";
import { db, enforcementActionTable, wardTable, aqiReadingTable } from "@workspace/db";
import { ListEnforcementQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /enforcement
router.get("/enforcement", async (req, res): Promise<void> => {
  const query = ListEnforcementQueryParams.safeParse(req.query);
  const city = query.success ? (query.data.city ?? "Chennai") : "Chennai";

  // Get enforcement actions joined with ward info
  const actions = await db
    .select({
      id: enforcementActionTable.id,
      wardId: enforcementActionTable.wardId,
      wardName: wardTable.name,
      priorityScore: enforcementActionTable.priorityScore,
      sourceType: enforcementActionTable.sourceType,
      recommendationText: enforcementActionTable.recommendationText,
      evidenceJson: enforcementActionTable.evidenceJson,
      status: enforcementActionTable.status,
    })
    .from(enforcementActionTable)
    .innerJoin(wardTable, eq(enforcementActionTable.wardId, wardTable.id))
    .where(eq(wardTable.city, city))
    .orderBy(desc(enforcementActionTable.priorityScore))
    .limit(20);

  // Enrich with latest AQI
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const enriched = await Promise.all(
    actions.map(async (action) => {
      const [latest] = await db
        .select()
        .from(aqiReadingTable)
        .where(
          and(
            eq(aqiReadingTable.wardId, action.wardId),
            gte(aqiReadingTable.timestamp, cutoff)
          )
        )
        .orderBy(desc(aqiReadingTable.timestamp))
        .limit(1);

      return {
        id: action.id,
        wardId: action.wardId,
        wardName: action.wardName,
        priorityScore: action.priorityScore,
        sourceType: action.sourceType,
        recommendationText: action.recommendationText,
        status: action.status,
        evidencePoints: action.evidenceJson ?? [],
        currentAqi: latest?.aqiValue ?? 0,
      };
    })
  );

  res.json(enriched);
});

export default router;
