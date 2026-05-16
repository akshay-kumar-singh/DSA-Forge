# ⚡ DSA Forge

> **Train like a hero. Think like an engineer. Never quit again.**

DSA Forge is a personal DSA (Data Structures & Algorithms) training platform built to help you actually get good — not by watching solutions, but by being guided to think through them yourself. One mode, one mission: forge your problem-solving mind.

---

## Why DSA Forge?

Most people fail at DSA because platforms like LeetCode show you the answer the moment you give up. You watch it, feel like you learned something, and forget it in 24 hours. DSA Forge removes that escape hatch entirely.

The AI coach (powered by Gemini, Mistral, Groq, or OpenRouter) **never gives you solution code**. It pushes you to think. It gives hints, pseudocode, diagrams, and approach nudges — but the code always comes from you.

---

## Features

### Forge Mode (The Only Mode)
- AI never reveals solution code — not even if you beg
- Full context awareness: AI sees your problem, your current editor code, and the entire chat history
- Natural conversation: say "hi", ask off-topic questions — AI responds like a real assistant, not a bot stuck on code hints
- Approach hints, pseudocode, complexity analysis, diagram explanations

### AI-Powered Diagram Explanations
- Mermaid.js renders clean algorithm flowcharts, tree diagrams, and graph visualizations inline in chat
- No more ASCII art — proper dark-mode diagrams that match the UI

### Monaco Code Editor
- Professional-grade editor with syntax highlighting
- "Deploy" button runs your JavaScript code in a sandboxed environment
- Auto-generates test cases from problem examples
- **"Get Intel"** button sends your current code to AI and asks what you're doing right and what to think about next — without spoiling the solution

### Approach Board
- Write out your thinking and strategy before you start coding
- AI reads your approach and can redirect you if you're heading in the wrong direction
- Separate from the chat — purely your space to think out loud

### Hint Progression System
- 3 levels of hints per problem: Vague → Medium → Specific
- Unlock one at a time — no skipping straight to the spoiler
- Forces you to genuinely try before getting more help

### Stuck Timer
- If you haven't typed in the editor for 10 minutes, the AI automatically sends an encouraging message with a Level 1 hint
- Designed to replace the urge to open a YouTube tutorial

### Field Notes
- Per-problem notes that persist across sessions
- Jot down patterns, observations, mistakes — build your own DSA reference over time

### Missions Sidebar
- Problems organized by DSA category: Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Sliding Window, and more
- Difficulty tags visible at a glance
- Training missions for concept-first learning before coding

### Mastery & Spaced Repetition
- Mark problems as Mastered once you've solved them independently
- Timestamps tracked for spaced repetition reminders
- Dashboard shows: streak, problems attempted, mastered count

### 3D Visual Design
- Three.js animated background — floating wireframe geometric shapes with electric blue glow
- Subtle and non-distracting during coding sessions (lazy-loaded, paused on editor view)
- 3D animated hero on the landing page

### Tldraw Whiteboard
- Built-in whiteboard tab for sketching out your own algorithm diagrams
- Use it before coding to map out your approach visually

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS 4.0 |
| AI Providers | Google Gemini, Mistral, Groq (Llama 3), OpenRouter |
| AI SDK | @ai-sdk/react, Google Generative AI SDK |
| Database | Supabase (localStorage fallback) |
| Code Editor | Monaco Editor (@monaco-editor/react) |
| Diagrams | Mermaid.js |
| 3D Graphics | Three.js |
| Whiteboard | Tldraw |
| Icons | Lucide React |
| Animation | Framer Motion (Motion) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (or use localStorage fallback without setup)
- At least one AI provider API key

### Installation

```bash
git clone https://github.com/yourusername/dsa-forge.git
cd dsa-forge
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase (optional — app works with localStorage fallback)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers (add whichever you have)
GEMINI_API_KEY=your_gemini_api_key
MISTRAL_API_KEY=your_mistral_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start forging.

---

## Project Structure

```
dsa-forge/
├── app/
│   ├── page.tsx              # Main application component
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # AI provider handler (Forge Mode system prompt)
│   └── globals.css
├── components/
│   ├── Editor/               # Monaco editor + Get Intel button
│   ├── Chat/                 # AI chat panel + Mermaid diagram renderer
│   ├── ApproachBoard/        # Pre-coding thinking panel
│   ├── MissionsSidebar/      # Problem list with categories + difficulty tags
│   ├── FieldNotes/           # Per-problem notes
│   ├── Whiteboard/           # Tldraw integration
│   └── ThreeBackground/      # Three.js animated background
├── lib/
│   ├── supabase.ts           # Supabase client + localStorage fallback
│   ├── problems.ts           # Problem definitions and metadata
│   └── hints.ts              # Hint progression logic
├── public/
├── DESIGN.md
├── next.config.ts
└── README.md
```

---

## How the AI Works

The AI has a strict Forge Mode system prompt that it follows in every conversation:

1. **Never output solution code** — not in full, not partially, not "just as an example"
2. **Read what the user actually typed** — if it's a greeting, respond normally; if it's a question, answer it; if it's a stuck message, give a hint
3. **Use the full context** — problem statement + current editor code + chat history
4. **Escalate help gradually** — start with a nudging question, then pseudocode, then a diagram, then a specific hint
5. **Encourage, don't lecture** — the tone is a senior dev mentoring a junior, not a judge scoring performance

---

## Saving Your Work

- **Ctrl+S** or the Save button saves your current code
- Notes auto-save as you type
- Mastery status and review timestamps sync to Supabase
- If Supabase is not configured, everything falls back to localStorage automatically

---

## Theme

DSA Forge uses a **Marvel / S.H.I.E.L.D. Tech Lab** aesthetic:

- **Background**: Deep space dark (`#0a0a0f`)
- **Primary accent**: Electric blue (`#3b82f6`)
- **Secondary accent**: Alert red (`#ef4444`)
- **Typography**: Outfit (headings) + Inter (body)
- **Style**: Sharp geometry, glowing borders, tech-grid textures

UI vocabulary:

| Old term | DSA Forge term |
|---|---|
| Problems | Missions |
| Solved | Completed |
| Hints | Intel |
| Notes | Field Notes |
| Run Code | Deploy |
| Categories | Divisions |
| Training | Briefing |

---

## Roadmap

- [ ] Multi-language support in sandbox (Python, Java via remote runner)
- [ ] Peer review mode — share your approach (not code) with others
- [ ] Weekly mission sets with themed problem clusters
- [ ] Voice mode — talk through your approach, AI responds via audio
- [ ] Mobile app (React Native)

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

---

## License

MIT — do whatever you want with it, just don't sell the answer key.

---

> *"The obstacle is the way. The problem you can't solve today is the one that makes you dangerous tomorrow."*