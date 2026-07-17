# ⚡ DSA Forge

> **Train like a hero. Think like an engineer. Never quit again.**

**DSA Forge** is a high-performance training facility built for engineers who want to master problem-solving. This isn't just another LeetCode clone—it's a Socratic AI-powered laboratory designed to forge your mind by removing the "copy-paste" escape hatch.

**Live:** https://dsa-forge-akshay.vercel.app/

---

## 🛡️ The Forge Philosophy

Most platforms show you the answer the moment you get stuck. You watch a video, feel like you've learned, and forget it tomorrow. **DSA Forge removes that weakness.**

The AI coach (powered by **Mistral** or **Gemini**) follows the **Forge Protocol**:
1. **No Code Spoilers**: It will *never* give you solution code.
2. **Socratic Guidance**: It pushes you to think through escalating hints, diagrams, and logic nudges.
3. **Execution-First**: It guides you to a working mental model so *you* can write the code.

---

## 🚀 Key Features

### 🎖️ Mission Control (NeetCode 150)
*   **Full problem roadmap** organized by pattern (Arrays & Hashing → Math & Geometry) with difficulty badges.
*   **Accordion sections**: each pattern collapses/expands with per-section progress (e.g. `4/9`); the section you're working in opens automatically.
*   **Auto-scroll**: the sidebar automatically scrolls to your current mission — even after a reload, you pick up exactly where you left off.
*   **Checkbox Mastery**: mark missions as mastered; progress syncs to the cloud automatically.
*   **Spaced Repetition**: a collapsible **Due for Revision** card resurfaces mastered problems on an expanding 7 → 14 → 30-day ladder. Revise the problem, hit ✓ (or confirm the prompt that appears when you save it) and it's rescheduled; the card disappears when nothing is due.
*   **Ranks**: rise from **INITIATE** to **COMMANDER** as you master more missions.

### 🧠 Forge Mode (AI Coaching)
*   **Streaming replies** — answers render token-by-token, no long waits.
*   **Hint escalation ladder** — from a gentle nudge to a full plain-English blueprint, never code.
*   **Context-aware** — the AI sees the problem, your current code, and your Field Notes on every message.
*   **Stuck detection** — idle for 10 minutes and the coach proactively checks in with a hint.
*   **Mermaid diagrams** — data structures and traversals are drawn, not just described.

### 📝 Field Notes
*   Per-problem notes for your approach, complexity analysis, and learnings — write your plan here before you code.
*   The AI reads your notes automatically and critiques your direction.
*   Saved to the cloud with your code.

### ⚙️ Professional Code Runner
*   **Multi-language**: JavaScript runs instantly in-browser; **Python, Java, and C++** execute remotely via the Judge0 API.
*   **Auto-test injection**: runs your solution against the problem's example input automatically.
*   **Monaco editor** with per-language starter code, font settings, Ctrl+S save, and Ctrl+Enter run.

### 🛠️ Custom Sandbox
*   Paste any external/interview problem into the **Custom Sandbox** and solve it with full AI coaching.

### 📈 GitHub Activity Tracker (optional)
*   Saves and mastered events are committed to a tracker repo via the GitHub API — your DSA grind shows up in your contribution graph.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (React 19, App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + CSS variables (dark/light themes) |
| **AI Providers** | Mistral (default, server-side) · Google Gemini (client-side) · Groq/OpenRouter (server-side, optional) |
| **Persistence** | MongoDB (Mongoose) + localStorage for session prefs |
| **Code Editor** | Monaco Editor |
| **Code Execution** | In-browser (JS) + Judge0 CE API (Python/Java/C++) |
| **Diagrams** | Mermaid |
| **Notifications** | Sonner |
| **Animation** | Motion + Three.js landing background |
| **Layout** | react-resizable-panels |
| **Icons** | Lucide React |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (e.g. free MongoDB Atlas cluster)
- An API key for at least one AI provider (Mistral recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dsa-forge.git
cd dsa-forge

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# ...then fill in the values (see table below)

# Start the Forge
npm run dev
```

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | Cloud progress sync (code, notes, mastered list) |
| `MISTRAL_API_KEY` | ✅* | Default AI coach, used by `/api/chat` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | ✅* | Gemini provider (called from the browser — restrict the key) |
| `GROQ_API_KEY` | optional | Groq models via `/api/chat` |
| `OPENROUTER_API_KEY` | optional | OpenRouter models via `/api/chat` |
| `GITHUB_PAT` | optional | GitHub activity tracker (`repo` scope) |
| `GITHUB_USERNAME` | optional | Owner of the tracker repo |
| `GITHUB_TRACKER_REPO` | optional | Repo name that receives activity commits |

\* At least one AI provider key is needed for Forge AI to respond.

### Deploy

Deployed on **Vercel** — push to `Main` and set the same environment variables in the Vercel project settings.

---

## 🏛️ Project Vocabulary

| Platform Term | DSA Forge Term |
|---|---|
| Problems | Missions |
| Categories | Divisions |
| Run / Submit | **Run** |
| Solved | **Mastered** |
| Notes | Field Notes |
| Learning | Training |

---

## 📜 License

MIT — Build, learn, and conquer.

---

> *"The obstacle is the way. The problem you can't solve today is the one that makes you dangerous tomorrow."*
