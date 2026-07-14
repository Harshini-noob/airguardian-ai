import { logger } from "./logger";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  messages: GroqMessage[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, "Groq API error");
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}
