/**
 * @nutshell/core — LLM Client
 *
 * Abstract LLM interface with provider implementations and retry logic.
 */

import type { NutshellConfig } from "./types.js";
import { callMock } from "./mocks.js";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
}

// ─── PROVIDER IMPLEMENTATIONS ─────────────────────────────────────────────────

async function callAnthropic(
  config: NutshellConfig,
  system: string,
  user: string
): Promise<LLMResponse> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.api_key || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return {
    content: data.content?.[0]?.text || "",
    model: data.model,
  };
}

async function callOpenAI(
  config: NutshellConfig,
  system: string,
  user: string
): Promise<LLMResponse> {
  const baseUrl = config.base_url || "https://api.openai.com";
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    model: data.model,
  };
}

async function callOpenAICompatible(
  config: NutshellConfig,
  system: string,
  user: string
): Promise<LLMResponse> {
  return callOpenAI({ ...config, base_url: config.base_url }, system, user);
}

async function callOllama(
  config: NutshellConfig,
  system: string,
  user: string
): Promise<LLMResponse> {
  const baseUrl = config.base_url || "http://localhost:11434";
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
      format: "json",
    }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const data = await res.json();
  return {
    content: data.message?.content || "",
    model: config.model,
  };
}

// ─── DISPATCH + RETRY ─────────────────────────────────────────────────────────

async function callLLMOnce(
  config: NutshellConfig,
  system: string,
  user: string
): Promise<LLMResponse> {
  if (config.provider === "mock" || (!config.api_key && config.provider !== "ollama")) {
    return callMock(system, user);
  } else if (config.provider === "anthropic") {
    return callAnthropic(config, system, user);
  } else if (config.provider === "openai") {
    return callOpenAI(config, system, user);
  } else if (config.provider === "ollama") {
    return callOllama(config, system, user);
  } else if (config.provider === "custom" && config.base_url) {
    return callOpenAICompatible(config, system, user);
  }
  throw new Error(`Unknown provider: ${config.provider}`);
}

export async function callLLM(
  config: NutshellConfig,
  system: string,
  user: string
): Promise<LLMResponse> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callLLMOnce(config, system, user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isRetryable = /429|rate.?limit|5\d{2}|server.?error|timeout|ECONNRESET/i.test(msg);
      if (!isRetryable || attempt === maxRetries - 1) throw e;
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("callLLM: unreachable");
}
