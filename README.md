# ⚡ DSA Forge

> **Train like a hero. Think like an engineer. Never quit again.**

**DSA Forge** is a high-performance training facility built for engineers who want to master problem-solving. This isn't just another LeetCode clone—it's a Socratic AI-powered laboratory designed to forge your mind by removing the "copy-paste" escape hatch.

---

## 🛡️ The Forge Philosophy

Most platforms show you the answer the moment you get stuck. You watch a video, feel like you've learned, and forget it tomorrow. **DSA Forge removes that weakness.**

The AI coach (powered by **Mistral**, Gemini, or Groq) follows the **Forge Protocol**:
1. **No Code Spoilers**: It will *never* give you solution code.
2. **Socratic Guidance**: It pushes you to think through hints, diagrams, and logic nudges.
3. **Execution-First**: It guides you to a working mental model so *you* can write the code.

---

## 🚀 Key Features

### 🛠️ Personal Practice & Custom Sandbox
*   **Recruiter Mode**: Paste in any external question or interview problem to solve it within the Forge environment.
*   **Sandbox**: Perfect for practicing custom logic, interview prep, or specific recruiter assignments.

### 🧠 Forge Mode (AI Coaching)
*   **Mistral-Powered by Default**: Optimized for high-speed, accurate logic guidance.
*   **Multi-Model Support**: Switch between Mistral, Gemini, Groq, or OpenRouter.
*   **Context Aware**: The AI sees your problem description, your current code, and your Approach Board simultaneously.

### 🧬 Integrated Whiteboard & Field Notes
*   **Tldraw Whiteboard**: Sketch out tree structures, graph traversals, or pointer logic directly in the sidebar.
*   **Field Notes**: Per-problem markdown notes for complexity analysis and persistent learnings.
*   **Mutually Exclusive Logic**: Panels intelligently switch between Notes and Approach to keep your workspace focused.

### ⚙️ Professional Code Runner
*   **Multi-Language Support**: Run **Python, Java, C++, and JavaScript** instantly via the integrated Piston API.
*   **Actionable Feedback**: Real-time results with **Sonner** toast notifications for execution status and sync updates.

### 🎖️ Mission Control & Progression
*   **Ranking System**: Rise from **INITIATE** to **COMMANDER** as you master more problems.
*   **Checkbox Mastery**: Simple, intuitive sidebar checkboxes to mark missions as completed.
*   **Auto-Save Protocol**: Marking a mission as mastered automatically triggers a secure database sync.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (React 19) |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS + Tailwind CSS 4.0 |
| **AI Providers** | Mistral AI (Default), Google Gemini, Groq, OpenRouter |
| **Persistence** | Supabase (Database) + localStorage fallback |
| **Code Editor** | Monaco Editor |
| **Code Execution** | Piston API (Remote Runner) |
| **Whiteboard** | Tldraw |
| **Notifications** | Sonner |
| **Animation** | Motion |
| **Icons** | Lucide React |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- API Keys for your preferred AI providers (Mistral, Gemini, etc.)
- (Optional) Supabase account for cross-device persistence

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dsa-forge.git

# Install dependencies
npm install

# Set up environment variables (.env.local)
NEXT_PUBLIC_GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Start the Forge
npm run dev
```

---

## 🏛️ UI & Aesthetic

The Forge uses a **S.H.I.E.L.D. Tech Lab** aesthetic:
*   **Base**: Deep space dark (`#0a0a0f`)
*   **Primary**: Electric blue accents (`#3b82f6`)
*   **Highlight**: Success green (`#22c55e`)
*   **Interactions**: Collapsible sidebars and chat for a "Focused Code" experience.

---

## 🏛️ Project Vocabulary

| Platform Term | DSA Forge Term |
|---|---|
| Problems | Missions |
| Categories | Divisions |
| Deploy / Submit | **Run** |
| Solved | **Mastered** |
| Notes | Field Notes |
| Training | Briefing |

---

## 📜 License

MIT — Build, learn, and conquer.

---

> *"The obstacle is the way. The problem you can't solve today is the one that makes you dangerous tomorrow."*