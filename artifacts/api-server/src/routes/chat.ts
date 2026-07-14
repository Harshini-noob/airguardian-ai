import { Router, type IRouter } from "express";
import { desc, eq, and, gte } from "drizzle-orm";
import { db, wardTable, aqiReadingTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { callGroq } from "../lib/groq";

const router: IRouter = Router();

// POST /chat
router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, city = "Chennai" } = parsed.data;

  // Build RAG context from DB
  const wards = await db
    .select()
    .from(wardTable)
    .where(eq(wardTable.city, city))
    .limit(10);

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const wardContexts = await Promise.all(
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

      return `${ward.name} (${ward.landUseType}): AQI ${latest?.aqiValue ?? "N/A"}, PM2.5 ${latest?.pm25 ?? "N/A"} µg/m³`;
    })
  );

  const context = wardContexts.join("\n");

  const systemPrompt = `You are AeroSense, an AI assistant for urban air quality intelligence in ${city}, India.

Current air quality data for ${city} wards:
${context}

Answer questions about air quality, pollution sources, health risks, and enforcement actions.
Be concise, factual, and cite specific ward data when relevant.
If asked about a ward not in the data, acknowledge you don't have that data.`;

  try {
    const answer = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      { maxTokens: 600, temperature: 0.5 }
    );

    const sources = wards.slice(0, 3).map((w) => `${w.name}, ${city} monitoring data`);

    res.json({ answer, sources });
  } catch (err) {
    req.log.error({ err }, "Chat LLM error");
    res.status(500).json({
      answer: "I'm having trouble connecting to my AI backend. Please try again in a moment.",
      sources: [],
    });
  }
});

export default router;
