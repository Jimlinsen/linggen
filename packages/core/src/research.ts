/**
 * @nutshell/core — Wikipedia Research
 *
 * Before generating world seeds or souls, fetch actual scholarly material
 * from Wikipedia. This grounds the LLM's output in real sources rather than
 * training-data impressions.
 *
 * Uses the MediaWiki REST API — no key required.
 */

const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKI_SEARCH  = "https://en.wikipedia.org/w/api.php";
const ZH_SUMMARY   = "https://zh.wikipedia.org/api/rest_v1/page/summary";
const ZH_SEARCH    = "https://zh.wikipedia.org/w/api.php";

export interface WikiArticle {
  title: string;
  extract: string;        // plain text summary, ~300-600 words
  url: string;
  language: "en" | "zh";
}

export interface ResearchBundle {
  tradition?: WikiArticle;
  character?: WikiArticle;
  supplementary: WikiArticle[];  // related articles (philosophy, era, etc.)
}

// ─── LOW-LEVEL FETCH ─────────────────────────────────────────────────────────

async function fetchSummary(title: string, lang: "en" | "zh" = "en"): Promise<WikiArticle | null> {
  const base = lang === "zh" ? ZH_SUMMARY : WIKI_SUMMARY;
  const url = `${base}/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "nutshell/0.1.0 (灵根 Linggen)" },
    });
    if (!res.ok) return null;
    const data = await res.json() as { title: string; extract: string; content_urls?: { desktop?: { page?: string } } };
    if (!data.extract || data.extract.length < 50) return null;
    return {
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page || url,
      language: lang,
    };
  } catch (e: unknown) {
    // Network errors are non-fatal for research — propagate null but log context
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[nutshell] fetchSummary("${title}", ${lang}) failed: ${msg}`);
    return null;
  }
}

async function searchWiki(query: string, lang: "en" | "zh" = "en"): Promise<string[]> {
  const base = lang === "zh" ? ZH_SEARCH : WIKI_SEARCH;
  const url = `${base}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "nutshell/0.1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json() as { query?: { search?: Array<{ title: string }> } };
    return (data.query?.search || []).map(r => r.title);
  } catch {
    return [];
  }
}

// ─── TRADITION RESEARCH ──────────────────────────────────────────────────────

/** Map tradition names to good Wikipedia search terms */
const TRADITION_SEARCH_TERMS: Record<string, { en: string[]; zh?: string[] }> = {
  greek:         { en: ["Ancient Greek religion", "Greek mythology", "Olympian gods"] },
  norse:         { en: ["Norse mythology", "Norse cosmology", "Prose Edda"] },
  fengshen:      { en: ["Investiture of the Gods", "Chinese mythology"], zh: ["封神演义", "商朝神话"] },
  vedic:         { en: ["Vedic religion", "Rigveda", "Hindu mythology"] },
  egyptian:      { en: ["Ancient Egyptian religion", "Egyptian mythology", "Kemetic religion"] },
  mesopotamian:  { en: ["Mesopotamian mythology", "Sumerian religion", "Babylonian religion"] },
  celtic:        { en: ["Celtic mythology", "Irish mythology", "Welsh mythology"] },
  shinto:        { en: ["Shinto", "Kojiki", "Japanese mythology"] },
  taoist:        { en: ["Taoism", "Chinese mythology", "Three Pure Ones"], zh: ["道教神话", "三清"] },
  mayan:         { en: ["Maya mythology", "Popol Vuh", "Maya religion"] },
  tibetan:       { en: ["Tibetan Buddhism", "Vajrayana", "Tibetan mythology"] },
  aztec:         { en: ["Aztec mythology", "Mexica religion", "Fifth Sun"] },
  tang:          { en: ["Tang dynasty", "Tang dynasty culture", "Chinese Buddhism Tang"], zh: ["唐朝文化", "盛唐"] },
  victorian:     { en: ["Victorian era", "Religion in Victorian England", "Victorian science and religion"] },
};

export async function researchTradition(
  tradition: string,
  language?: "en" | "zh"
): Promise<ResearchBundle> {
  const key = tradition.toLowerCase().replace(/[\s-]+/g, "");
  const terms = TRADITION_SEARCH_TERMS[key] || { en: [tradition, `${tradition} mythology`] };
  const lang = language || (terms.zh ? "zh" : "en");

  const supplementary: WikiArticle[] = [];

  // Primary: try direct titles
  let primary: WikiArticle | null = null;
  const searchList = lang === "zh" && terms.zh ? terms.zh : terms.en;

  for (const term of searchList) {
    const article = await fetchSummary(term, lang === "zh" ? "zh" : "en");
    if (article) { primary = article; break; }
  }

  // Fallback: search
  if (!primary) {
    const query = lang === "zh" && terms.zh ? terms.zh[0] : terms.en[0];
    const results = await searchWiki(query, lang === "zh" ? "zh" : "en");
    for (const title of results.slice(0, 2)) {
      const article = await fetchSummary(title, lang === "zh" ? "zh" : "en");
      if (article) { primary = article; break; }
    }
  }

  // Supplementary: fetch 1-2 more related articles (in English always for depth)
  const suppTerms = terms.en.slice(1, 3);
  for (const term of suppTerms) {
    if (supplementary.length >= 2) break;
    const article = await fetchSummary(term, "en");
    if (article && article.title !== primary?.title) {
      supplementary.push(article);
    }
  }

  return { tradition: primary || undefined, supplementary };
}

// ─── CHARACTER RESEARCH ──────────────────────────────────────────────────────

const CHARACTER_OVERRIDES: Record<string, string[]> = {
  // Greek
  "Zeus":        ["Zeus"],
  "Hera":        ["Hera"],
  "Poseidon":    ["Poseidon"],
  "Hades":       ["Hades"],
  "Athena":      ["Athena"],
  "Apollo":      ["Apollo"],
  "Artemis":     ["Artemis"],
  "Hermes":      ["Hermes"],
  "Ares":        ["Ares"],
  "Aphrodite":   ["Aphrodite"],
  "Hephaestus":  ["Hephaestus"],
  "Dionysus":    ["Dionysus"],
  "Demeter":     ["Demeter"],
  "Persephone":  ["Persephone"],
  "Prometheus":  ["Prometheus"],
  "Achilles":    ["Achilles"],
  // Tang / Chinese
  "李白":         ["李白"],
  "杜甫":         ["杜甫"],
  "孙悟空":       ["孙悟空"],
  // Victorian
  "Sherlock Holmes": ["Sherlock Holmes"],
};

export async function researchCharacter(
  character: string,
  tradition: string,
  language?: "en" | "zh"
): Promise<WikiArticle[]> {
  const isZh = language === "zh" || /[\u4e00-\u9fff]/.test(character);
  const lang: "en" | "zh" = isZh ? "zh" : "en";

  const results: WikiArticle[] = [];
  const overrides = CHARACTER_OVERRIDES[character];

  if (overrides) {
    for (const title of overrides) {
      const article = await fetchSummary(title, lang);
      if (article) { results.push(article); break; }
    }
    // Also try English if primary was Chinese
    if (isZh && results.length === 0) {
      for (const title of overrides) {
        const article = await fetchSummary(title, "en");
        if (article) { results.push(article); break; }
      }
    }
  }

  // Fallback search
  if (results.length === 0) {
    const query = isZh
      ? `${character} ${tradition}`
      : `${character} ${tradition} mythology`;
    const titles = await searchWiki(query, lang);
    for (const title of titles.slice(0, 2)) {
      const article = await fetchSummary(title, lang);
      if (article) { results.push(article); break; }
    }
  }

  return results;
}

// ─── FORMAT FOR PROMPT ───────────────────────────────────────────────────────

/** Condense research into a compact string for prompt injection */
export function formatResearchForPrompt(bundle: ResearchBundle, charArticles: WikiArticle[]): string {
  const sections: string[] = [];

  if (bundle.tradition) {
    sections.push(
      `=== SOURCE: ${bundle.tradition.title} (${bundle.tradition.url}) ===\n` +
      bundle.tradition.extract.slice(0, 600)
    );
  }

  for (const supp of bundle.supplementary.slice(0, 2)) {
    sections.push(
      `=== SOURCE: ${supp.title} (${supp.url}) ===\n` +
      supp.extract.slice(0, 400)
    );
  }

  for (const char of charArticles) {
    sections.push(
      `=== CHARACTER SOURCE: ${char.title} (${char.url}) ===\n` +
      char.extract.slice(0, 600)
    );
  }

  if (sections.length === 0) return "";

  return (
    "\n\n--- WIKIPEDIA RESEARCH (use this to ground your response in actual scholarship) ---\n\n" +
    sections.join("\n\n") +
    "\n\n--- END RESEARCH ---\n"
  );
}
