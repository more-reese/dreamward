# Dreamward Protocol Specification v0.5.1
**Date:** March 6, 2026
**Status:** Post-stress-test consolidation (Dreams 2 + 3)

---

## §0 — What Dreamward Solves

**Problem:** "I had a dream. Now what?"

Dreamers at every level — from first recall to expert practitioner — lack a shared structure for engaging their dreams. Beginners don't know frameworks exist. Experts are locked into one. Dreamward meets them wherever they are and grows with them.

**Protocol answer:** A conversation table. Neutral dream primitives on the surface. Traditions as opt-in seats. The dreamer always owns the dream; traditions offer ways in.

---

## §1 — Design Invariants

Six rules that constrain every other decision.

**1. The dream is primary.**
Raw prose is always a complete, valid artifact. No structure is ever required.

**2. Structure is additive, never required.**
Every layer beyond raw prose is opt-in. The protocol never blocks capture.

**3. Boundaries belong to traditions, not the base schema.**
What counts as "one dream" is tradition-specific. The protocol provides coordinates; traditions provide segmentation logic.

**4. No tradition-scoped interpretation without explicit invocation.**
The protocol never applies a tradition's framework without the dreamer's conscious choice. Structural classification (scale, texture, spatial layers) is acknowledged as minimally interpretive — these are documented design choices, not neutral observations.

**5. Minimal assumptions, explicit when made.**
The protocol does not claim neutrality. It claims minimal and declared commitments. When the schema makes a choice (e.g., temporal sequencing as organizational axis, spatial containment as structural metaphor), it is documented as a design choice, not a universal truth.

**6. Capture ease > Parsability > Expressiveness.**
When in tension, optimize for 3am writability first, machine readability second, theoretical completeness last.

---

## §2 — Architecture Overview

```
┌─────────────────────────────────────────┐
│  SEATS                                  │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ Dreamer  │  │ Tradition (1..n)   │   │
│  │(required)│  │ UX: Teacher|Analyst│   │
│  └────┬─────┘  └─────────┬─────────┘   │
│       │                  │              │
│       ▼                  ▼              │
│  ┌─────────────────────────────────┐    │
│  │     ENGAGEMENT LAYER            │    │
│  │  EngagementNode (analyze|practice) │ │
│  └──────────────┬──────────────────┘    │
│                 │                        │
│  ┌──────────────▼──────────────────┐    │
│  │     BRIDGE LAYER                │    │
│  │  BridgeAnnotation (typed)       │    │
│  │  TraditionRelation (authored)   │    │
│  └──────────────┬──────────────────┘    │
│                 │                        │
├─────────────────▼───────────────────────┤
│  TABLE (Layer 1: Dream Capture)         │
│  DreamNode + Spatial + Perspective      │
│  Dreamer-owned. Traditions read-only.   │
├─────────────────────────────────────────┤
│  TRADITION SHELF (Layer 2)              │
│  TraditionNode (canonical, shared)      │
│  TraditionActivation (per-dreamer)      │
│  Protocol-provided. Dreamer activates.  │
└─────────────────────────────────────────┘
```

**Four protocol-level nodes:**
- **DreamNode** — the dream coordinate (table)
- **TraditionNode** — the tradition coordinate (shelf, shared)
- **TraditionActivation** — the dreamer's relationship to a tradition (per-dreamer)
- **EngagementNode** — how tradition meets dream

**Two seat types (protocol level):**
- **Dreamer** (required) — owns the dream
- **Tradition** (opt-in, one or more) — UX renders as Teacher mode or Analyst mode

---

## §3 — Layer 1: The Table (Dream Capture)

### §3.1 — DreamNode

The atomic unit of the protocol. What the dreamer brings to the table.

```
DreamNode {
  id:               string        // auto-generated
  raw_text:         string        // REQUIRED. The dream in the dreamer's words.
  scale:            enum          // moment | scene | episode | night | life_dream
                                  // default: episode
  mode:             enum          // ontological | practical | protocol
                                  // default: practical
  texture:          enum          // narrative | fragment | anchor_image | composite
  lucid:            boolean       // default: false
  created_at:       datetime
  updated_at:       datetime
}
```

**Invariant:** `raw_text` is never empty. A DreamNode with no prose is invalid.

**Scale** (nested hierarchy: moment < scene < episode < night < life_dream):
- `moment` — single image, sensation, or instant
- `scene` — continuous spatiotemporal unit
- `episode` — contiguous stretch at dreamer's chosen granularity (default)
- `night` — all dream material from one sleep period
- `life_dream` — extended narrative across nights (rare)

**Mode:**
- `ontological` — pure phenomenal stream, minimal boundary commitments
- `practical` — everyday journaling, "I had a dream" (default)
- `protocol` — full machine-readable annotation with explicit declarations

**Texture:**
- `narrative` — connected storyline with temporal flow
- `fragment` — disconnected pieces, incomplete recall
- `anchor_image` — single image or sensation, no plot
- `composite` — mixed types within one DreamNode

**Design note (per Invariant 5):** Scale and texture are structural classifications that embed minimal interpretive assumptions (temporal sequencing, narrative vs. fragment distinction). These are documented design choices, not neutral observations.

**Design note (v0.5.1):** When a dream's narrative register is notable (e.g., mythic, fairy-tale, cinematic, documentary), note it as a freeform qualifier after the texture value in `[notes]`: `texture: narrative (mythic register)`. This keeps texture lean while allowing expressive precision. Do not expand the texture enum for register.

### §3.2 — BoundarySystem

Boundaries are tradition-dependent, declared explicitly, never hardcoded.

```
BoundarySystem {
  id:               string
  name:             string
  tradition_id:     string        // nullable; dreamer-defined systems valid
  description:      string
  rules:            BoundaryRule[]
}

BoundaryRule {
  trigger_conditions: string[]    // what causes a boundary
  scale_level:      enum          // which scale this rule operates at
  merge_policy:     enum          // merge | split | defer_to_dreamer
}
```

Examples: REM-based (neuroscience), recall-based (practical default), lucidity-event (TDY), session-report (Gestalt).

### §3.3 — Spatial Layers (Optional)

Three nested layers. Never required.

```
Dreamspace   → Abstract topology. Rules and structure of the dream world.
  └─ Dreamscape → Rendered environment. What the dreamer sees.
       └─ Dreamplace → Specific location with identity or emotional charge.
                       May recur across dreams.
```

Containment: Dreamspace ⊃ Dreamscape ⊃ Dreamplace.

```
SpatialAnnotation {
  dreamnode_id:     string
  layer:            enum          // dreamspace | dreamscape | dreamplace
  label:            string
  recurrent:        boolean
  notes:            string        // optional
}
```

### §3.4 — Perspective (Optional)

Four neutral coordinates. Dreamer specifies whichever matter for a given dream.

| Primitive | What it captures |
|-----------|-----------------|
| `experiential_locus` | Where awareness is anchored — the "I" point |
| `viewpoint` | Visual/perceptual vantage — where you see from |
| `embodiment_mode` | How the dreamer is bodied: full, partial, disembodied, shifted |
| `multiplicity` | Whether simultaneous perspectives exist |

Perspective events: **shift**, **split**, **merge**, **handoff**.
Merges may not be discrete — "at some point this became true" is valid.

**Design note (v0.5.1):** `emotional_stance` is independent of `embodiment_mode`. A disembodied observer can experience strong emotion. These coordinates are orthogonal.

### §3.5 — DreamerContext (Optional)

Pre-interpretive associations the dreamer brings. Not tradition-scoped.

```
DreamerContext {
  id:               string
  target_ref:       string        // entity, dreamplace, theme, episode
  scope:            enum          // global (reusable) | local (one dream)
  context_type:     enum          // association | evaluation | status | intention
  content_text:     string
  created_at:       datetime
}
```

**Invariant:** DreamerContext is read-only to tradition processes. They may reference it; they may not modify it.

**Design note:** `target_ref` is intentionally unvalidated in v1.0. It is a freeform string referencing entities, dreamplaces, themes, or episodes. This trades referential integrity for capture ease (per Invariant 6). Tighten to typed references when entity model is formalized.

### §3.6 — Attachment Layers

Four layers describing how content relates to awareness:

| Layer | Definition | Protocol role |
|-------|-----------|---------------|
| **Phenomenal** | Raw experiential stream | Implicit in raw_text. Protocol-inert by definition. |
| **Registration** | Act of noticing or remembering | Lucidity flags, recall confidence |
| **Interpretive** | Meaning-making, always tradition-scoped | Never present without explicit opt-in |
| **Meta** | Commentary about the dream/recording process | Structural observations, process notes |

**Design note:** The phenomenal layer is named for intellectual honesty. The dream-as-lived is inaccessible; only the externalized text exists at Layer 1.

---

## §4 — Layer 2: The Tradition Shelf

### §4.1 — How Traditions Enter Dreamward

**Protocol provides → Dreamer activates → TraditionActivation tracks relationship.**

Traditions are not defined by dreamers. They are rooted in observable, canonical sources (primary texts, lineage holders, research literature). The protocol maintains canonical definitions. The dreamer activates them.

### §4.2 — TraditionNode (Shared, Canonical)

One per tradition. Protocol-owned. Immutable per version.

```
TraditionNode {
  id:                    string        // e.g., "tibetan-dream-yoga-wangyal-rinpoche"
  entry_type:            enum          // tradition | provocation
  name:                  string        // e.g., "Tibetan Dream Yoga (Wangyal Rinpoche)"
  cluster:               string        // navigational family grouping (see §4.5)

  // --- How the tradition knows ---
  epistemology_primary:  string        // primary way of knowing (see §4.5)
  epistemology_secondary: string       // secondary mode, or "none"

  // --- What the tradition thinks a dream is ---
  ontology:              string[]      // what the dream IS (array; multiple allowed)

  // --- What the tradition thinks dreams do ---
  functions:             string[]      // what dreams are FOR

  // --- What the dreamer does ---
  agency_style:          string        // dreamer's role (see §4.5)
  agency_notes:          string        // freeform qualifier

  // --- Context ---
  period:                string        // historical era
  region:                string        // geographic origin
  institutional_home:    string        // where the tradition lives

  // --- Authority ---
  key_figures:           string[]      // primary figures + key texts
  source_notes:          string        // unified: source critique + bias flags + extraction risk
                                       // embedded "Flag:" markers for specific risks
  transmission_constraint: enum        // lineage_restricted | location_restricted | publicly_teachable

  // --- Activation requirements ---
  activation_requirements: {
    acknowledgment_text: string        // tradition-provided context shown before activation
    requires_acknowledgment: boolean   // if true, dreamer must acknowledge before first engagement
  }

  // --- Dream Match ---
  dream_keywords:        string[]      // tradition's keyword signature for matching
}
```

**Invariant:** TraditionNode canonical fields are immutable per version. Changes require a new protocol version.

### §4.3 — TraditionActivation (Per-Dreamer)

One per dreamer per tradition. Created on first activation. Tracks the dreamer's evolving relationship with a tradition.

```
TraditionActivation {
  id:                    string
  tradition_id:          string        // references TraditionNode.id
  dreamer_id:            string
  divergence_status:     enum          // canonical | adapted | syncretic
  accepted:              string[]      // mappings/concepts the dreamer has accepted
  rejected:              string[]      // mappings/concepts explicitly rejected
  added:                 string[]      // dreamer's personal additions
  divergence_count:      integer       // total divergences from canonical
  acknowledgment_given:  boolean       // true if activation_requirements met
  activated_at:          datetime
  updated_at:            datetime
}
```

**divergence_status:**
- `canonical` — dreamer working within tradition as defined (divergence_count = 0)
- `adapted` — dreamer has made modifications but core framework intact
- `syncretic` — dreamer has combined elements from this tradition with others to the point where the engagement is a personal synthesis, not a tradition application

**Activation flow:**
1. Dreamer selects tradition
2. If `activation_requirements.requires_acknowledgment == true`, display `acknowledgment_text`
3. Dreamer acknowledges → `acknowledgment_given = true`
4. TraditionActivation created with `divergence_status: canonical`
5. As dreamer accepts/rejects/adds → `divergence_count` increments, `divergence_status` may shift

**Invariant:** TraditionActivation is dreamer-owned. The protocol never modifies it without dreamer action.

### §4.4 — TraditionRelation (Authored Cross-Tradition Links)

Explicit, authored relations between traditions. Populated by steward (you + AI + primary texts initially).

```
TraditionRelation {
  id:                    string
  source_tradition:      string        // tradition_id
  target_tradition:      string        // tradition_id
  source_term:           string        // in source tradition's vocabulary
  target_term:           string        // in target tradition's vocabulary
  relation_type:         enum          // shares_reference | shares_sense_only |
                                       // tension | incommensurable
  content:               string        // steward's notes on the relation
  authority_basis:       string        // e.g., "CW9 vol.2 + Norbu Ch.4"
  status:                enum          // provisional | reviewed | canonical
  created_at:            datetime
}
```

**Relation types (Frege-informed):**
- `shares_reference` — same phenomenon, different framing (same reference, different sense)
- `shares_sense_only` — same word, different phenomena ("false umbrella"; same sense, different reference)
- `tension` — genuine disagreement or incompatible framing
- `incommensurable` — cannot be compared on shared axis. Terminal. Not an error.

**Invariant:** `incommensurable` is a valid, stable, terminal relation. The protocol does not attempt to resolve incommensurability.

**Computed relations (app layer, not protocol):**
The graph view computes implicit edges from shared `cluster`, `epistemology_primary`, and `agency_style`. These are display-layer relations, not authored protocol-level links.

### §4.5 — Controlled Vocabularies

**entry_type:**
- `tradition` — meets operational definition (ontology + function + method + validation)
- `provocation` — boundary case that challenges or refuses the framework

**cluster** (navigational grouping, not ontological claim):
- `Eastern Philosophical / Contemplative`
- `Depth / Clinical Psychology`
- `Cognitive / Quantitative Psychology`
- `Neurobiological / Evolutionary`
- `Indigenous / Shamanic Traditions`
- `Western Religious / Mystical`
- `Ancient / Classical Worldviews`
- `Contemporary, Frontier, Esoteric`

**epistemology_primary / epistemology_secondary:**
- `Phenomenological-contemplative`
- `Hermeneutic-clinical`
- `Empirical-experimental`
- `Revelatory`
- `Pragmatic-participatory`
- `Clinical-therapeutic`
- `Manual-based/Omen`
- `Mythic/Ancestral`
- `Descriptive/quantitative`
- `Anecdotal/Fringe`
- `Developmental`
- `Evolutionary`
- `none` (for secondary only)

**agency_style:**
- `Shape` — dreamer actively transforms dream content
- `Decode` — dreamer/interpreter reads meaning from dream
- `Observe` / `Describe` / `Measure` — dreamer documents without intervention
- `Neither` — tradition refuses agency framing
- `Both (Decode + Shape)` — tradition supports both modes
- `Incubate` / `Partner` — dreamer co-creates with external agency
- `Act/Resolve` — dreamer carries dream into waking action
- `Transcend` — dreamer uses dream as vehicle beyond dream content
- Compound forms accepted (e.g., `"Decode primarily; Shape (active imagination)"`)

**ontology** (array, freeform with common values):
- `State of consciousness`
- `Alternate world/journey`
- `Symbolic text`
- `Message from unconscious`
- `Message from God/spirits/ancestors`
- `Brain process`
- `Simulation (embodied, default network)`
- `Predictive signs`
- `Metaphorical simulation of emotional arousal`
- `Disguised wish-fulfillment`
- `none` / `deliberately refuses ontological commitment`

**functions** (array, freeform with common values):
- `Moral/spiritual instruction`
- `Healing`
- `Emotional regulation/processing`
- `Creativity/problem-solving`
- `Divination/decision`
- `Social/collective meaning-making`
- `Biological/neurological`
- `Minimal/byproduct`
- `Threat rehearsal`
- `Memory consolidation`

**transmission_constraint:**
- `lineage_restricted` — requires authorized teacher/lineage
- `location_restricted` — requires specific sacred/institutional context
- `publicly_teachable` — accessible without gatekeeping

**Design note:** ontology and functions are freeform with common values because the sole steward authors all entries in v1.0. Tighten to controlled enum + `other` escape hatch when community contribution begins.

### §4.6 — Authority Model

| Phase | Authority source | TraditionRelation status | TraditionNode governance |
|-------|-----------------|--------------------------|--------------------------|
| **v1.0 (steward)** | Steward + AI + primary texts | `provisional` | Steward-curated |
| **Beta** | Practitioners review | `reviewed` | Community review |
| **GA** | Tradition authorities validate | `canonical` | Formal governance TBD |

**Deferred governance questions (resolve before GA):**
- Authority verification methodology: how to confirm someone represents a tradition
- Dispute resolution: process when competing claimants disagree
- Removal/correction: what happens when a tradition authority rejects the protocol's representation

---

## §5 — Engagement Layer

### §5.1 — EngagementNode

How a tradition meets a dream. The point of contact between DreamNode and TraditionNode.

```
EngagementNode {
  id:                    string
  dreamnode_id:          string        // which dream
  tradition_id:          string        // which tradition
  engagement_type:       enum          // analyze | practice
  label:                 string        // OPTIONAL. Freeform. Distinguishes multiple
                                       // engagements of same type on same dream.
                                       // e.g., "1.0-structural-archetypal",
                                       //       "1.1-post-jungian-archetypal"
  content:               string        // the engagement output
  status:                enum          // stub | in_progress | complete
  created_at:            datetime
}
```

**Two types:**
- `analyze` — tradition makes meaning of the dream (interpretive, descriptive, structural, comparative, pattern-based). UX renders as **Analyst mode**.
- `practice` — tradition prescribes action/technique (exercise, ritual, intention-setting, re-entry). UX renders as **Teacher mode**.

**Design note:** `content` is intentionally an unstructured string in v1.0. Jungian analysis and Tibetan Dream Yoga practice instructions have different structures; premature structuring would constrain rather than enable. Let real engagements reveal what structure is needed.

**Design note (v0.5.1):** `label` was added after stress-testing showed that a single tradition+mode pair can produce multiple valid, non-contradictory reads on the same dream (e.g., classical Jungian structural-archetypal vs. personal-complex reads). Without `label`, these are indistinguishable in the schema. If omitted, the engagement is treated as the default (unlabeled) read for that tradition+mode pair.

### §5.2 — BridgeAnnotation

Typed link between a tradition concept and specific dream content within a DreamNode.

```
BridgeAnnotation {
  id:                    string
  dreamnode_id:          string
  tradition_id:          string
  relationship_type:     enum          // labels_as | interprets_as |
                                       // engages_via | observes_as
  sense:                 string        // tradition's concept (Frege)
  reference:             string        // what it points to in the dream (Frege)
  content:               string        // optional annotation text
  created_at:            datetime
}
```

**Invariant:** BridgeAnnotations never modify `raw_text`. They annotate; they do not overwrite.
**Invariant:** Multiple BridgeAnnotations from different traditions may coexist on the same DreamNode without resolution.

---

## §6 — .dream Notation

### §6.1 — Priority Stack

**capture_ease > parsability > expressiveness**

### §6.2 — Conformance Stages

| Stage | What's required | Who it's for |
|-------|----------------|--------------|
| **1 — Raw Prose** | Plain text. No blocks, no markup. Complete and valid. | 3am capture. Everyone. |
| **2 — Light Markup** | `[text]` block + `[notes]` with scale/texture/tags. | Morning review. |
| **3 — Full Protocol** | All block types. Declared modes, perspective, spatial, `[view]` blocks. | Deep work. Analysis. |

### §6.3 — Block Vocabulary

No block is ever required. Raw prose is always valid.

| Block | Purpose | Required attr | Optional attr |
|-------|---------|--------------|---------------|
| `[text]` | Phenomenological narrative. The dream. | — | — |
| `[notes]` | Structural/meta commentary. | — | — |
| `[view]` | Tradition engagement overlay. `mode` is `analyst` or `teacher`. Multiple allowed per dream, including multiple with same tradition+mode. | `tradition` | `mode`, `label` |
| `[perspective]` | Perspective state/event declarations. | — | — |
| `[gap]` | Marks missing/forgotten content. | — | — |
| `[uncertain]` | Flags low-confidence recall. | — | — |

**`[view]` attributes:**
- `tradition` (required) — tradition_id from TraditionNode
- `mode` (optional) — `analyst` or `teacher`. Maps 1:1 to EngagementNode types.
- `label` (optional, v0.5.1) — freeform string distinguishing multiple reads from the same tradition+mode pair. Maps to EngagementNode.label.

**Recognized `[notes]` subsections (all optional):**

| Subsection | Purpose | Since |
|------------|---------|-------|
| `scale` | Episode, scene, moment, etc. | v0.3 |
| `texture` | Narrative, fragment, anchor_image, composite. Freeform register qualifier allowed (e.g., `narrative (mythic register)`). | v0.3; register convention v0.5.1 |
| `lucid` | Boolean + optional qualifier | v0.3 |
| `key_actions` | Actions explicitly described in the dream text | v0.5.1 |
| `key_emotions` | Emotions explicitly described or felt in the dream text | v0.5.1 |
| `key_figures` | Named or described figures in the dream | v0.5.1 |
| `key_objects` | Objects with narrative or emotional weight | v0.5.1 |
| `cross_dream` | Dreamer-owned cross-dream associations (pre-interpretive). Notation surface for DreamerContext (scope: global). | v0.5.1 |

**Design note (v0.5.1):** `[notes]` subsections are conventions for human writers, not machine-enforced in v1.0. `key_actions` and `key_emotions` list only what is explicitly present in the dream text or the dreamer's own felt sense. They are pre-interpretive. `key_objects` is for objects with narrative weight — not every mentioned object needs listing. `cross_dream` is read-only to tradition processes.

### §6.4 — Worked Example: Stadium Dream

**Stage 1:**
```
I am at the front of a long line outside of a baseball stadium. They open
up the gates and I'm the first person to check in. There is a hispanic man
behind me who seems irritated he wasn't first. I note the stadium's new
check in process. Now I am at the bottom of the stairs walking up. Someone
whose face I recognize stops me, talks to me like we're old friends. I
realize it's a guy from little league but can't remember his name. He's
telling me about making something of himself. I want to listen but I'm
impatient, I just want my seat. Now I'm in the bleachers, dark green,
friends already sitting. I get deja vu. I anticipated seeing that guy
at the stairs.
```

**Stage 2:**
```
[text]
I am at the front of a long line outside of a baseball stadium. They open
up the gates and I'm the first person to check in. There is a hispanic man
behind me who seems irritated he wasn't first. I note the stadium's new
check in process. Now I am at the bottom of the stairs walking up. Someone
whose face I recognize stops me, talks to me like we're old friends. I
realize it's a guy from little league but can't remember his name. He's
telling me about making something of himself. I want to listen but I'm
impatient, I just want my seat. Now I'm in the bleachers, dark green,
friends already sitting. I get deja vu. I anticipated seeing that guy
at the stairs.

[notes]
scale: episode
texture: narrative
lucid: false

key_emotions:
  - impatience (wanting seat, not wanting to listen)
  - deja vu at bleachers — anticipated the stairs encounter

key_figures:
  - familiar stranger (little league, can't name, recognized face)
  - hispanic man (irritated competitor)
  - friends (already seated)

key_objects:
  - stadium = new dreamplace (check recurrence)
```

**Stage 3:**
```
[text]
I am at the front of a long line outside of a baseball stadium. They open
up the gates and I'm the first person to check in. There is a hispanic man
behind me who seems irritated he wasn't first. I note the stadium's new
check in process. Now I am at the bottom of the stairs walking up. Someone
whose face I recognize stops me, talks to me like we're old friends. I
realize it's a guy from little league but can't remember his name. He's
telling me about making something of himself. I want to listen but I'm
impatient, I just want my seat. Now I'm in the bleachers, dark green,
friends already sitting. I get deja vu. I anticipated seeing that guy
at the stairs.

[notes]
scale: episode
mode: protocol
boundary_system: recall-based
texture: narrative

spatial:
  dreamplace: baseball_stadium (new; check recurrence)
  dreamscape: line → gates → stairs → bleachers (linear progression)
  dreamspace: public/competitive topology

key_actions:
  - checking in first at the gate
  - walking up stairs
  - being stopped by familiar stranger
  - sitting down with friends

key_emotions:
  - impatience + obligation (at stairs encounter)
  - deja vu (anticipatory, not lucidity)

key_figures:
  - familiar stranger (little league, recognized face, can't name)
  - hispanic man (irritated at status)
  - friends (already seated)

[perspective]
scenes 1-2: locus=embodied, viewpoint=first_person, embodiment=full
scene 3:    locus=embodied, viewpoint=first_person
            emotional_stance: impatience + obligation
scene 4:    locus=seated, viewpoint=first_person
            event: recognition (deja vu — anticipatory, not lucidity)

[view tradition="jungian" mode="analyst"]
Hispanic man = shadow competitor (irritation at status).
Familiar stranger = forgotten aspect of self seeking validation.
"Making something of himself" = ego-individuation tension.
Impatience = resistance to integrating past identity.
Deja vu = Self signaling pattern recognition.

[view tradition="tibetan-dream-yoga" mode="teacher"]
Deja vu = near-recognition event. Awareness almost caught itself.
Stadium as samsaric arena — competition, status, performance.
Practice opportunity: set intention to recognize deja vu as
lucidity trigger next occurrence.
```

---

## §7 — Validation Rules

### §7.1 — Core Invariants

1. Every DreamNode has non-empty `raw_text`.
2. EngagementNodes and BridgeAnnotations require `tradition_id`.
3. DreamerContext is read-only to tradition processes.
4. Multiple tradition views coexist without forced resolution.
5. `incommensurable` TraditionRelations are terminal — no forced synthesis.
6. TraditionNode canonical fields are immutable per version.
7. TraditionActivation divergences are always explicit — never silent drift.
8. `raw_text` is never modified by any annotation layer.
9. Traditions with `requires_acknowledgment: true` cannot produce EngagementNodes until `acknowledgment_given: true` on the relevant TraditionActivation.
10. Multiple `[view]` blocks with the same tradition and mode on a single DreamNode are valid when distinguished by `label`. *(v0.5.1)*

### §7.2 — Conformance

A conforming implementation MUST:
- Accept raw prose as a complete, valid DreamNode
- Never apply tradition-scoped interpretation without explicit dreamer invocation
- Scope every engagement and annotation to a `tradition_id`
- Preserve `raw_text` as immutable
- Allow multiple tradition views to coexist without forced resolution
- Track TraditionActivation divergences explicitly
- Display activation_requirements before first engagement with restricted traditions
- Allow multiple `[view]` blocks with the same tradition and mode on a single DreamNode, distinguished by `label` *(v0.5.1)*

A conforming implementation SHOULD:
- Support all three .dream conformance stages
- Display engagement type (analyze/practice) as UX mode (Analyst/Teacher)
- Surface divergence_status when TraditionActivation is not canonical
- Preserve embedded "Flag:" markers from source_notes in tradition display

A conforming implementation MAY:
- Suggest tradition activation via dream keyword matching (Dream Match)
- Surface patterns across DreamNodes (application layer, not protocol layer)
- Compute implicit tradition edges from shared fields (graph view)

---

## §8 — Explicitly Deferred (v1.0)

| Item | Reason | Revisit trigger |
|------|--------|-----------------|
| DialogueNode | No authorship model yet | After dreamer compares 2+ tradition readings on same DreamNode 5+ times |
| Peer seats | No network to test | After multi-dreamer pilot |
| Nested scale formalization | Complexity explosion risk | After boundary systems tested empirically |
| Phenomenal layer schema | Protocol-inert by definition | Only if contemplative traditions request |
| Multi-night linking | Needs recurrence data | After 30+ dreams logged |
| Voice-first interface | Application layer | UX thread |
| Frege bridge population (at scale) | Practically unproven | After informal resonances observed |
| WakingContextLink | Conceptually defined only | After dream-wake pattern demand |
| Formal .dream grammar (BNF/PEG) | Not needed for single implementation | Before multi-implementation interop (v1.1) |
| SHACL validation shapes | Not needed pre-beta | v1.1 |
| Conformance test suite | Not needed for single implementation | Before beta |
| Namespace hosting | Not needed pre-beta | v1.1 |
| Authority governance formalization | Sole steward for v1.0 | Before GA |
| Entity model for DreamerContext.target_ref | Capture ease prioritized | When referential integrity needed |
| Machine-enforced [notes] subsection validation | Human conventions sufficient for v1.0 | Before multi-implementation interop |

---

## §9 — Open Questions (Remaining)

1. **DreamNode UX name.** DreamNode is locked at protocol level. What does the UX call it? — UX thread decision.
2. **EngagementNode type expansion.** Two types (analyze/practice) locked for v1.0. Add a third only if usage reveals a natural category neither type covers.
3. **Canonical governance (post-beta).** Who curates TraditionNodes at scale? Process TBD before GA.
4. **Dream Match algorithm.** Currently keyword-based in POC. Protocol defines `dream_keywords` field; matching algorithm lives in application layer.

---

## §10 — Protocol Fitness (per Unreasonable Sufficiency)

| Dimension | Status | Evidence |
|-----------|--------|----------|
| **Sufficiently Generative** | Partially tested | Dream 2 (TDY dual-mode) and Dream 3 (Jungian triple-read) demonstrated tradition engagement on real dreams. Table dialogue untested. |
| **Sufficiently Legible** | Strong | Conversation table metaphor; .dream notation human-readable; Stage 2 [notes] subsections readable at 3am. |
| **Sufficiently Stewardable** | Structural support in place | Canonical nodes + TraditionActivation + authority model |
| **Sufficiently Evolvable** | Tested once | `label` attribute added from stress test without breaking existing structures. Deferred items have revisit triggers. |
| **Sufficiently Legitimate** | Strong | Opt-in only; no tradition flattened; source_notes preserve bias flags; activation requirements for restricted traditions |
| **Sufficiently Constrained** | Strong | capture_ease > parsability > expressiveness; 10 invariants enforced |

---

## §11 — Changelog

| Version | Date | Changes |
|---------|------|---------|
| v0.2 | 2026-03-04 | Initial schema draft (Space file) |
| v0.3 | 2026-03-05 | First consolidated spec — all threads merged |
| v0.4 | 2026-03-06 | TraditionNode rebuilt from POC field audit; seats simplified; TraditionRelation promoted |
| v0.5 | 2026-03-06 | Post-audit: extracted TraditionActivation; weakened Invariant 4 (honesty); added activation_requirements for restricted traditions; collapsed [interpretation]/[engagement] into [view mode]; added design notes for intentional tradeoffs; added deferred governance questions; honest Protocol Fitness table |
| v0.5.1 | 2026-03-06 | Stress-test delta from Dreams 2+3: added `label` attr to `[view]` block and EngagementNode; defined standard optional `[notes]` subsections (key_actions, key_emotions, key_figures, key_objects, cross_dream); documented texture register convention; confirmed emotional_stance/embodiment_mode orthogonality (Invariant note §3.4); confirmed multiple same-tradition `[view]` coexistence (Invariant 10); updated worked example; updated Protocol Fitness with test evidence |

---

*Ship it. Test it. Let the dreams tell you what's missing.*
