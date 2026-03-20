/**
 * @nutshell/evolution — LLM
 * Thin wrapper around the same providers used in @nutshell/core.
 */
import type { EvolutionConfig } from "./types.js";

async function callLLMOnce(
  config: EvolutionConfig,
  system: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const { provider, model, api_key, base_url } = config.llm;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": api_key || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    return data.content?.[0]?.text || "";
  }

  if (provider === "openai" || provider === "custom") {
    const base = base_url || "https://api.openai.com";
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || "";
  }

  if (provider === "ollama") {
    const base = base_url || "http://localhost:11434";
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json() as any;
    return data.message?.content || "";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function callLLM(
  config: EvolutionConfig,
  system: string,
  user: string
): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: user },
  ];

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await callLLMOnce(config, system, messages);
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        // First retry: wait 1 second
        await new Promise(r => setTimeout(r, 1000));
      } else if (attempt === 1) {
        // Second retry: if JSON parse error, ask model to fix its output
        const errMsg = String(err);
        if (errMsg.toLowerCase().includes("json") || errMsg.toLowerCase().includes("parse")) {
          messages.push({
            role: "user",
            content: "The previous response was not valid JSON. Please output only the JSON object, no other text.",
          });
        }
        // No extra wait before final attempt
      }
    }
  }
  throw lastError;
}
