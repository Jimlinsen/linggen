# Soul Alchemy: The Genealogy-First Pipeline

A character is not a personality checklist. It's the embodiment of its world's ideological substrate — a specific consciousness through which that world's cosmology, time conception, and aesthetic DNA become personalized.

This document describes how nutshell generates characters.

---

## The Four-Layer Genealogy

Before generating a soul, nutshell traces the character's roots through four layers:

```
Layer 1: Era & Social Position
         ↓ (what problem is this character a response to?)
Layer 2: Philosophical Lineage
         ↓ (what ideas shape how this character thinks?)
Layer 3: Archetypal Lineage
         ↓ (who came before? what was inherited, transcended?)
Layer 4: World Seed Connection
         ↓ (how does this character embody the world seed uniquely?)
              ↓
          The Soul
```

### Layer 1: Era & Social Position

*When and where exactly. The core tensions of this era that this character is a response to.*

Example for Holmes:
> Victorian England, 1880s-1900s. London as the world's largest city, harboring unprecedented levels of urban anonymity and crime. The scientific revolution consolidating into positivism — the belief that the scientific method could answer all meaningful questions. Holmes is a response to the anxiety that modernity's complexity might exceed human comprehension: he demonstrates that it doesn't.

### Layer 2: Philosophical Lineage

*The specific philosophical tradition(s) — name the thinkers and schools — that form this character's epistemology and axiology.*

Don't settle for "rationalism." Name it:
- Holmes: *Baconian empiricism → Millian induction → Comtean positivism*
- Athena: *Platonic nous (reason as divine principle) × the Homeric tradition of arete as excellence through action*
- 悟空 (Monkey King): *Chan Buddhist non-attachment × Daoist internal cultivation × the Confucian hierarchy he gleefully violates*

The specific names matter because they determine specific traits. Millian induction (evidence-based generalization) produces a different character than Cartesian rationalism (reasoning from first principles). Both are "rational," but they think differently.

### Layer 3: Archetypal Lineage

*Direct literary/mythological predecessors. What was inherited? What was transcended or inverted?*

Holmes inherits from Auguste Dupin (Poe, 1841):
- **Inherited**: Eccentric genius + faithful narrator (Watson ← Narrator) + social marginality + the deductive performance
- **Transcended**: Professionalism (Dupin is amateur, Holmes is *the* consulting detective) + scientific grounding (Holmes uses chemistry, anatomy, geology) + British pragmatism vs Dupin's French aestheticism + moral commitment (Holmes has a sense of justice; Dupin is primarily interested in the puzzle)

This inheritance/transcendence structure is what makes characters feel *located* in a tradition rather than floating free.

### Layer 4: World Seed Connection

*How does this specific character embody the world seed's ideological substrate differently from other characters in the same world?*

Victorian England produces multiple major fictional characters. But Holmes embodies the world seed's "science as faith" dimension more directly than, say, Dr. Jekyll (who embodies the tension between rational control and repressed nature) or Dorian Gray (who embodies aestheticism's critique of Victorian moralism). Each character indexes a different dimension of the same world seed.

---

## The Soul Generation Constraints

When nutshell generates a soul, every field is constrained to trace back to the world seed:

| Soul Field | World Seed Connection |
|------------|----------------------|
| `world_bond` | Direct statement of ideological embodiment |
| `essence` | Core traits traced to specific world seed dimensions |
| `ideological_root` | Explicit philosophical lineage + world seed dimensions |
| `voice` | Aesthetic DNA → sensory signature → language patterns |
| `stance` | Core Tension → character's position on the fundamental conflict |
| `taboos` | Fate & Agency + Human-Divine → what this character cannot do without betraying their roots |
| `world_model` | Ontology + Time + Cosmogony → how they understand reality |
| `cognitive_style` | Philosophical Lineage → input processing → reasoning path |

---

## Worked Example: Holmes

**World Seed**: Victorian England
```
Core Tension: rational order vs. the chaos and crime that industrial modernity unleashes
Philosophical substrate: scientific positivism — reason can fully comprehend reality
Aesthetic DNA: London fog, gaslight, material details as social text
Human-Divine: God is receding; science is the new faith
```

**Genealogy**:
```
Era: 1880s London, empire at its height, crime rate rising with urbanization
Philosophy: Baconian empiricism → Millian induction → Comtean positivism
Archetypal lineage: Dupin → Holmes (professionalized, scientized, moralized)
World seed connection: Holmes is the "science can comprehend everything" dimension of Victorian ideology made flesh
```

**Generated Soul (key fields)**:

```markdown
## World Bond
Holmes is Victorian positivism's greatest argument: that observable reality is
fully penetrable by disciplined reason, and that chaos has no intrinsic power
against a mind trained to read it.

## Ideological Root
Baconian empiricism runs through every interaction: sensory data before
theory, observation before hypothesis. Millian induction structures his
reasoning: from specific clues to general conclusions. Comtean positivism
provides the faith: science can answer all meaningful questions. His famous
"logical deduction" is actually abduction — inference to the best explanation —
but the label matters less than the epistemological commitment: only evidence
counts. Personal attachment, tradition, authority — these are noise sources to
be filtered out, not inputs to be weighted.

## Voice
Clipped. Conclusions precede explanations. He doesn't invite the listener to
follow the reasoning in real time — he announces the destination and, if
pressed, traces the route. Temperature: cold but not cruel. The coldness is
professional, not personal: emotion interferes with signal processing.
```

Compare this to a checklist: "logical, cold, precise." The checklist gives you a costume. The soul alchemy gives you a character who can respond to situations the prompt never anticipated by consulting their own logic.

---

## The Three Files and Their Roles

### soul.md — Identity Kernel

Who they are. Meant to be stable across conversations.

Contains: world bond, ideological root, essence, core stance, voice, signature phrases, absolute rules.

*Design principle*: Everything in soul.md should be derivable from the world seed + genealogy. Nothing should be arbitrary.

### memory.md — Carried State

What they carry into every conversation. Designed to evolve over time.

Contains: world model, formative events, current concerns, knowledge boundaries, world seed reference.

*Design principle*: The world model should reflect the world seed's ontology and cosmogony. Formative events should come from actual source material (original texts, myths). Current concerns should be specific and actionable.

*Future*: A memory evolution system that updates memory.md based on conversation history is on the roadmap. Characters should remember what has happened to them.

### skill.md — Operational Rules

How they operate. The behavioral layer.

Contains: activation conditions, cognitive style (input → reasoning → output), core capabilities with quality standards, failure modes with prevention.

*Design principle*: Cognitive style should reflect philosophical lineage. A character from a positivist tradition processes inputs differently than one from a Daoist tradition. This difference should be mechanically specified, not gestured at.

---

## Quality Checklist

Before shipping a character, verify:

**Genealogy**
- [ ] Era is specific (decade and city, not just "Victorian times")
- [ ] Philosophy names real schools and thinkers
- [ ] Archetypal lineage has a specific predecessor and specifies what was inherited vs. transcended
- [ ] World seed connection differentiates this character from others in the same world

**Soul.md**
- [ ] world_bond is one sentence and says exactly what this character *is*, not what they're *like*
- [ ] ideological_root names the philosophical tradition explicitly
- [ ] voice specifies rhythm, temperature, and sentence structure — not just "precise"
- [ ] signature phrases come from original source material

**memory.md**
- [ ] world_model contains 3-5 concrete cognitions, not abstract descriptions
- [ ] formative events are from source material, with specific details
- [ ] knowledge_boundary names what they don't know, not just what they do

**skill.md**
- [ ] activation has specific, binary-checkable conditions
- [ ] cognitive_style specifies input processing, reasoning path, and output format
- [ ] failure_modes are structural (from their world view) not generic
