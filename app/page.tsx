'use client';

import { FormEvent, useMemo, useState } from "react";
import classNames from "classnames";

type ScriptLine = {
  speaker: string;
  line: string;
};

type SceneBreakdown = {
  title: string;
  location: string;
  timeOfDay: string;
  logline: string;
  visualPalette: string;
  beats: string[];
  imagePrompt: string;
  videoPrompt: string;
};

type ProductionPlan = {
  logline: string;
  tone: string;
  script: ScriptLine[];
  scenes: SceneBreakdown[];
};

const CHARACTER_NAMES = [
  "Alex",
  "Jordan",
  "Riley",
  "Taylor",
  "Morgan",
  "Avery",
  "Quinn",
  "Sloane",
  "Rowan",
  "Phoenix",
  "Harper",
  "Elliot"
];

const SUPPORTING_NAMES = [
  "Casey",
  "Dakota",
  "Hayden",
  "Emerson",
  "Remy",
  "Skyler",
  "Reese",
  "Kai",
  "Noah",
  "Sage",
  "Peyton",
  "Jules"
];

const GENRE_TONES: Record<string, string> = {
  romance: "Tender, luminous, emotionally driven",
  love: "Warm, intimate, hopeful",
  adventure: "Alive, kinetic, heart-pounding",
  mystery: "Atmospheric, shadowy, tense",
  detective: "Noir-inspired, moody, deliberate",
  sci: "Sleek, visionary, futuristic",
  space: "Expansive, awe-struck, ethereal",
  cyber: "Neon-lit, high-contrast, edgy",
  dystopia: "Gritty, desaturated, urgent",
  fantasy: "Mythic, vibrant, enchanting",
  magic: "Glowing, whimsical, surreal",
  horror: "Foreboding, stark, unsettling",
  ghost: "Haunting, mist-laden, melancholic",
  thriller: "High-stakes, precise, tense",
  comedy: "Playful, lively, colorful",
  heist: "Slick, methodical, urbane",
  sports: "Dynamic, triumphant, high-energy"
};

const VISUAL_MOODS = [
  "rain-soaked city streets reflecting neon glows",
  "sun-drenched vistas with cinematic lens flares",
  "moody interiors with chiaroscuro lighting",
  "wind-swept coastal cliffs under dramatic skies",
  "lush forests painted with volumetric light",
  "brutalist architecture softened by ambient haze",
  "futuristic skylines wrapped in low-lying clouds",
  "deserted alleyways carved by shafts of light",
  "art deco interiors with polished brass highlights",
  "misty mountains framed by golden hour light",
  "retro diners with saturated color palettes",
  "industrial rooftops glowing in pre-dawn blue"
];

const LOCATION_PRESETS = [
  { keywords: ["city", "urban", "street", "neon", "metropolis"], location: "Downtown rooftop overlooking the city", timeOfDay: "Night" },
  { keywords: ["forest", "woods", "nature", "grove"], location: "Ancient forest clearing", timeOfDay: "Dusk" },
  { keywords: ["desert", "sand", "arid"], location: "Vast desert ridge", timeOfDay: "Twilight" },
  { keywords: ["ocean", "sea", "coast", "beach"], location: "Clifftop above the tide", timeOfDay: "Golden Hour" },
  { keywords: ["space", "galaxy", "planet"], location: "Observation deck aboard an orbital station", timeOfDay: "Starlit" },
  { keywords: ["castle", "kingdom", "throne"], location: "Torch-lit great hall", timeOfDay: "Night" },
  { keywords: ["lab", "science", "tech"], location: "High-security research lab", timeOfDay: "Late Night" },
  { keywords: ["village", "town", "market"], location: "Twinkling market square", timeOfDay: "Evening" }
];

const STRUCTURE_LABELS = [
  { title: "Spark", loglineLead: "Inciting moment", beatVerbs: ["Introduce", "Reveal", "Provoke"] },
  { title: "Escalation", loglineLead: "Rising conflict", beatVerbs: ["Collide", "Challenge", "Complicate"] },
  { title: "Resolution", loglineLead: "Climactic turn", beatVerbs: ["Confront", "Transform", "Resolve"] }
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function selectFromList<T>(list: T[], seed: number, offset = 0): T {
  const index = (seed + offset) % list.length;
  return list[index];
}

function uniqueSelect(primary: string[], seed: number, count: number) {
  const selections: string[] = [];
  let offset = 0;
  while (selections.length < count) {
    const candidate = selectFromList(primary, seed, offset);
    if (!selections.includes(candidate)) {
      selections.push(candidate);
    }
    offset += 1;
  }
  return selections;
}

function inferTone(idea: string): string {
  const lower = idea.toLowerCase();
  for (const [keyword, tone] of Object.entries(GENRE_TONES)) {
    if (lower.includes(keyword)) {
      return tone;
    }
  }
  return "Cinematic, grounded, emotionally resonant";
}

function inferLocation(idea: string, seed: number): { location: string; timeOfDay: string } {
  const lower = idea.toLowerCase();
  for (const preset of LOCATION_PRESETS) {
    if (preset.keywords.some((word) => lower.includes(word))) {
      return { location: preset.location, timeOfDay: preset.timeOfDay };
    }
  }
  const fallbackLocations = [
    { location: "Converted warehouse staging area", timeOfDay: "Midnight" },
    { location: "Glass-walled penthouse command center", timeOfDay: "Blue Hour" },
    { location: "Rain-specked tram station", timeOfDay: "Dawn" }
  ];
  return selectFromList(fallbackLocations, seed);
}

function extractKeywords(idea: string): string[] {
  return idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !["with", "that", "from", "into", "about", "after", "before", "under", "over", "between"].includes(word))
    .slice(0, 8);
}

function buildLogline(idea: string, hero: string, ally: string, tone: string): string {
  const keywords = extractKeywords(idea);
  const focus = keywords.slice(0, 3).join(", ") || "an unexpected revelation";
  return `${hero} and ${ally} navigate ${focus} with a ${tone.toLowerCase()} sensibility.`;
}

function craftScript(idea: string, hero: string, ally: string, tone: string, seed: number): ScriptLine[] {
  const keywords = extractKeywords(idea);
  const stakes = keywords.slice(0, 2).join(" & ") || "the moment";
  const catalyst = keywords.slice(2, 4).join(" & ") || "a fragile connection";
  const moodHint = tone.split(",")[0].toLowerCase();
  const narrator = selectFromList(["Director", "Cinematographer", "Narrator"], seed, 5);
  return [
    {
      speaker: narrator,
      line: `Camera drifts in, catching ${hero} as they center themselves amid ${stakes}.`
    },
    {
      speaker: hero,
      line: `\"If we misread ${catalyst}, everything fractures.\"`
    },
    {
      speaker: ally,
      line: `\"Then we don't misread it—we choreograph every beat.\"`
    },
    {
      speaker: hero,
      line: `\"Stay sharp. The air feels ${moodHint}, and the world is finally watching.\"`
    }
  ];
}

function craftScenes(idea: string, hero: string, ally: string, tone: string, seed: number): SceneBreakdown[] {
  const { location, timeOfDay } = inferLocation(idea, seed);
  const keywords = extractKeywords(idea);
  const palette = selectFromList(VISUAL_MOODS, seed, 3);

  return STRUCTURE_LABELS.map((structure, idx) => {
    const beatSeed = (seed + idx * 13) % 9973;
    const beatWords = keywords.length ? keywords : ["the plan", "the turning point", "the silence"];
    const beats = structure.beatVerbs.map((verb, beatIdx) => {
      const target = beatWords[(beatSeed + beatIdx) % beatWords.length];
      return `${verb} ${target}`;
    });

    const imagePrompt = [
      `${structure.title} of a cinematic narrative`,
      "hyper-realistic photography",
      `featuring ${hero} and ${ally}`,
      location.toLowerCase(),
      `${timeOfDay.toLowerCase()} ambience`,
      palette,
      "shot on IMAX 65mm, shallow depth of field, volumetric lighting, fine film grain"
    ].join(", ");

    const videoPrompt = [
      `${structure.title} sequence`,
      "cinematic video",
      `tracking shot with Steadicam`,
      `${hero} and ${ally} in ${location.toLowerCase()}`,
      `${timeOfDay.toLowerCase()} light`,
      palette,
      "dynamic camera movement, immersive spatial audio, 24fps, anamorphic lens flares"
    ].join(", ");

    return {
      title: `Scene ${idx + 1}: ${structure.title}`,
      location,
      timeOfDay,
      logline: `${structure.loglineLead} as ${hero} and ${ally} maneuver through ${idea.toLowerCase()}.`,
      visualPalette: palette,
      beats,
      imagePrompt,
      videoPrompt
    };
  });
}

function generatePlan(idea: string): ProductionPlan {
  const trimmed = idea.trim();
  const seed = hashString(trimmed || "default");
  const [hero] = uniqueSelect(CHARACTER_NAMES, seed, 1);
  const supporting = uniqueSelect(SUPPORTING_NAMES, seed, 2);
  const ally = supporting[0];
  const tone = inferTone(trimmed);

  return {
    logline: buildLogline(trimmed, hero, ally, tone),
    tone,
    script: craftScript(trimmed, hero, ally, tone, seed),
    scenes: craftScenes(trimmed, hero, ally, tone, seed)
  };
}

const DEFAULT_IDEA = "A lone archivist uncovers a conspiracy encoded in vintage film reels.";

export default function Page() {
  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [submittedIdea, setSubmittedIdea] = useState(DEFAULT_IDEA);

  const plan = useMemo(() => generatePlan(submittedIdea), [submittedIdea]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedIdea(idea);
  };

  return (
    <main className="px-6 py-16 md:px-16 lg:px-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="space-y-6">
          <p className="uppercase tracking-[0.4em] text-sm text-slate-400">Scene Director AI Agent</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-slate-100">Rapid pitch-to-production planner</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Provide a spark of an idea. Receive a distilled script draft, structured scene breakdowns, and ready-to-run prompts for image and video ideation—optimized for cinematic realism.
          </p>
        </header>

        <section className="gradient-border rounded-3xl">
          <div className="glass rounded-3xl border border-slate-800/70 p-8 sm:p-10 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <label htmlFor="idea" className="block text-sm uppercase tracking-[0.4em] text-slate-400">
                Concept Seed
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-5 py-4 text-base text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/60"
              />
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Generates 4-line script + 3 scenes</p>
                <button
                  type="submit"
                  className={classNames(
                    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em]",
                    "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 transition-transform hover:scale-[1.02]"
                  )}
                >
                  Direct the scene
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="gradient-border rounded-3xl">
            <div className="glass rounded-3xl border border-slate-800/70 p-8 space-y-6">
              <h2 className="font-display text-2xl text-slate-100">Story Core</h2>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Logline</p>
              <p className="text-lg text-slate-200">{plan.logline}</p>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Tone</p>
              <p className="text-lg text-slate-200">{plan.tone}</p>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Script Draft</p>
                <div className="space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  {plan.script.map((line, idx) => (
                    <p key={line.speaker + idx} className="text-slate-200">
                      <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">{line.speaker}:</span> {line.line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {plan.scenes.map((scene) => (
              <article key={scene.title} className="gradient-border rounded-3xl">
                <div className="glass rounded-3xl border border-slate-800/70 p-8 space-y-5">
                  <header className="space-y-3">
                    <h3 className="font-display text-xl text-slate-100">{scene.title}</h3>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                      {scene.location} · {scene.timeOfDay}
                    </p>
                    <p className="text-slate-200">{scene.logline}</p>
                  </header>
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Key Beats</p>
                    <ul className="space-y-2 text-slate-200">
                      {scene.beats.map((beat) => (
                        <li key={beat} className="flex gap-3">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                          <span>{beat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Visual Palette</p>
                    <p className="text-slate-300">{scene.visualPalette}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Image Prompt</p>
                    <p className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-slate-100">{scene.imagePrompt}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-pink-400">Video Prompt</p>
                    <p className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4 text-slate-100">{scene.videoPrompt}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
