/**
 * @nutshell/core — JSON Parsing
 *
 * Safe extraction and parsing of JSON from LLM responses.
 */

export function extractBalancedJSON(text: string): string | null {
  // Strategy 1: ```json code block
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlock) return codeBlock[1].trim();

  // Strategy 2: balanced brace matching for outermost { ... }
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

export function parseJSON<T>(raw: string, label: string): T {
  const jsonStr = extractBalancedJSON(raw);
  if (!jsonStr) {
    throw new Error(
      `${label}: Could not find JSON object in response. Got: ${raw.slice(0, 500)}`
    );
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    throw new Error(
      `${label}: JSON parse failed. Raw: ${jsonStr.slice(0, 500)}\nError: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}
