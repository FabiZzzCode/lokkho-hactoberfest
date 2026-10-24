# Lokkho — a CGPA goal tracker for university students

Live demo: https://lokkho-hactoberfest.vercel.app · 2-minute demo script: [DEMO.md](DEMO.md)

Built for Hacktoberfest Hack Day Chittagong × IEEE CS IIUC SBC.

## The problem
Students do not know what marks they need to reach their goal CGPA. They find out after results and get upset. Retake and improvement rules are confusing, and every department and semester has different courses.

## The solution
Pick your program and current semester, tick the courses you registered, enter your goal CGPA and past results. Lokkho then shows what you need next:

- the average GPA you need on your remaining credits (or that the goal is not reachable, and the best CGPA you can still get);
- the marks needed in the parts of each course that are still to come (for example how many of the 50 final marks), after you enter attendance, CT and mid marks;
- which retake or improvement raises your CGPA the most;
- exam alerts for mid and final exams in the next 30 days.

Gemma reads messy input (registration slips, curricula, marking schemes, what-if questions), writes kind study tips, and powers an **AI Advisor** that answers questions such as "Can I reach my target?" or "What marks do I need in the final to meet my goal?" by calling the app's own tools. The app works in **English and Bangla**.

**All grade maths is plain, tested code. The AI model never calculates grades.** If the AI is down, everything still works by hand.

## How it works
In plain words: the browser keeps one JSON profile in localStorage (there are no accounts and no database). A deterministic engine (`src/engine/`) computes GPA, CGPA, goal maths, marks needed, retake gains and exam alerts from one config file, [`src/config/grading.config.js`](src/config/grading.config.js). The server (`api/ai.js`) only forwards pasted text to Gemma, asks for JSON, validates it against a strict schema, and returns it for you to **review and edit before anything is saved**. Study tips get only the engine's numbers, and any tip containing a number or grade that was not in its input is hidden.

### What is plain code and what is AI
| Plain, tested code (no AI) | Gemma (AI) |
| --- | --- |
| GPA, CGPA, goal maths, marks needed, predictions, retake gains, exam alerts | Reads pasted text (slip, curriculum, marking scheme) into JSON that you review |
| IIUC result-page parser (paste a whole result page, all semesters fill at once) | Writes 4 to 6 short study tips from the engine's numbers |
| The advisor's tools and the grounding check | Chooses which tool to call and explains the tool results kindly |

### AI Advisor (agent)
The Advisor tab is a small chat. Press a quick button or type a question:

1. *Can I reach my target?*
2. *Predict my result*
3. *What should I get in each course?*
4. *What marks do I need in the final to meet my goal?*
5. *Should I retake something?*

On the Courses page, enter your attendance, CT / Quiz and mid marks, then press **Ask the AI advisor what I need**. Gemma picks a **tool**, the tool runs **in your browser on your own data**, and Gemma explains the result in plain language. Each tool used is shown as a small step under the answer. If the model fails or times out, the tool results are still shown, with a Retry button.

**The model never does maths.** Every number comes from a plain JavaScript tool in `src/advisor/tools/` (one file per tool, listed in `src/advisor/registry.js` with a name, description and argument schema):

| Tool | What it returns |
| --- | --- |
| `get_summary` | current CGPA, credits done and left, target CGPA |
| `required_avg` | GPA needed on the remaining credits; says clearly when the target is impossible |
| `marks_needed` | for one course, marks needed in the remaining components for each grade |
| `plan_courses` | for every current course: the target grade that reaches your goal, the marks needed in the parts still to come (usually the final), and the best grade still possible |
| `predict_result` | best, likely and worst semester GPA and CGPA, with the assumptions listed |
| `simulate_retake` | new CGPA if a course is retaken or improved with grade X, or a ranking of retakes |
| `exam_alerts` | mid and final exams in the next 30 days |
| `propose_target` | a *proposal* (new goal CGPA or a course target grade); nothing changes until you press **Apply** |

**How the loop works.** `api/agent.js` is stateless and only asks the model for the *next step*. Function calling is not used: the model follows a prompt-based JSON protocol, `{"tool": name, "args": {...}}` or `{"final": "text"}`. The browser (`src/advisor/runAgent.js`) runs the loop with at most **6 tool calls** per question and at most 25 seconds per model step, and sends only tool results back to the server, never the full profile. Bad tool arguments come back to the model as an error it can fix.

**Safety checks.**
- *Grounding check* (`src/advisor/grounding.js`): every number in the final answer must appear in a tool result. If not, the model is asked once to fix its draft; if it still invents numbers, a warning chip lists them. Whole numbers up to 10, list markers, course codes and the 4.00 scale are not counted as claims.
- *Write actions are proposals only*, with Apply and Dismiss buttons.
- Typed or pasted text is wrapped as untrusted data inside delimiters. The server validates every field, limits input size, and rate limits per IP (best effort, in memory). The API key stays on the server.
- Every AI call has a 30 second client timeout with a clear error and Retry button.
- Predictions are **scenario ranges from the marks you entered, not guarantees** (see Assumptions).

### Architecture
```mermaid
flowchart LR
  subgraph Browser
    UI[React UI] --> Engine[Deterministic engine<br/>src/engine]
    UI --> Tools[Advisor tools<br/>src/advisor/tools]
    UI <--> LS[(localStorage<br/>one JSON profile)]
    Loop[Agent loop<br/>runAgent.js] --> Tools
    Loop --> Ground[Grounding check]
  end
  Loop -- "question + tool results (no full profile)" --> Agent["api/agent.js<br/>stateless, validates, rate limits"]
  UI -- "pasted text for import / tips" --> Ai["api/ai.js"]
  Agent --> Gemma[(Gemma via Gemini API<br/>or local LM Studio / Ollama)]
  Ai --> Gemma
```

### Model(s) used
`gemma-4-26b-a4b-it`, a Gemma model by Google ([model page](https://ai.google.dev/gemma)), called through the **Gemini API** with a key from Google AI Studio. Google publishes the Gemma weights, but in the hosted demo the model is *called through Google's hosted API*, not run on our own server. No weights are in this repo. **License: to be confirmed from the official Gemma page; this README does not claim one.**

For the Gemma model on the Gemini API, calls use `thinkingLevel: minimal` to keep each step to a few seconds (set `AI_THINKING=off` if a model rejects it). A failed Google request (HTTP 5xx) is retried once.

**Local mode (no Google key).** Run a local model in [LM Studio](https://lmstudio.ai) or [Ollama](https://ollama.com), start its OpenAI-compatible server, and put this in `.env.local`:
```
AI_PROVIDER=openai_compat
AI_BASE_URL=http://localhost:1234/v1
AI_MODEL=<the model name your tool shows>
```
LM Studio's default address is `http://localhost:1234/v1` and Ollama's is `http://localhost:11434/v1`. Then run `npm run dev`. Smaller local models may follow the JSON protocol less reliably; the app then shows an error and manual entry still works.

### Tech stack
React + Vite (plain JavaScript, plain CSS), Vitest, Vercel serverless functions (`api/ai.js` and `api/agent.js`, 2 functions).

### Datasets
None. Sample data only; no real student information is in this repo.

## Assumptions (not confirmed with any university)
These are **configuration, not facts**. They live in [`src/config/grading.config.js`](src/config/grading.config.js) (look for `verified: false`), and the app shows a "verify with your department" note wherever they matter.

| Assumption | Default | Status |
| --- | --- | --- |
| Marks range per grade | A+ 80-100, A 75-79, A- 70-74, B+ 65-69, B 60-64, B- 55-59, C+ 50-54, C 45-49, D 40-44, F below 40 | **unverified** |
| Points for C, D and F | 2.25, 2.00, 0.00 | **unverified** (points for A+ to C+ were seen on a real result page) |
| Retake rule | the latest attempt replaces the earlier one; retake-eligible grades F, D, C, C+, B-; no maximum grade after retake | **unverified** (`RETAKE_POLICY`) |
| Attempted vs earned credits | CGPA uses counted credits; earned credits exclude failed courses | **unverified** (`CREDIT_RULE`) |
| Withdrawn (W) | 0 points; credits excluded from GPA and attempted credits | assumed |
| Prediction scenarios | likely = the same share of marks as scored so far (70% if nothing is marked), best = full marks on what is left, worst = 40% of the remaining marks | simple assumptions in `src/advisor/config.js` |

Other defaults:
- The **CSE curriculum** is based on one IIUC batch's results page. Other batches may differ. **Verify with your department.** The **BBA curriculum is a SAMPLE** with invented courses, not official.
- The default marking scheme is Attendance 10, CT / Quiz 10, Mid 30, Final 50 for theory, and Attendance 10, Lab work 40, Lab final 50 for labs. It is editable per course.
- GPA and CGPA are shown with 3 decimals; rounding is for display only.

## How to run it
```bash
nvm use                       # Node 20
npm install
cp .env.example .env.local    # then fill GEMINI_API_KEY yourself; never commit it
npm run dev                   # app + the same API handlers, no Vercel login needed
```

### Environment variables
Server side only, never prefixed with `VITE_`. Do not put quotes around values.

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `gemini` (default) or `openai_compat` for local mode |
| `GEMINI_API_KEY` | key from Google AI Studio |
| `GEMINI_MODEL` | default `gemma-4-26b-a4b-it` |
| `AI_BASE_URL`, `AI_MODEL` | local mode only |
| `AI_TIMEOUT_MS` | per-request model timeout, default 25000 |
| `AI_MAX_TOKENS` | default 1200 |
| `AI_THINKING` | optional; `minimal` (default) or `off` |

### Testing
```bash
npm test              # Vitest: engine, parser, tools, grounding, agent loop (mock model), API handlers, every page
npm run build
npm run check:secrets # fails if a tracked file looks like it contains a key
```
No test calls a real AI model. A private test for a real result page runs only if you place the page text in `fixtures/private/` (git-ignored); otherwise it is skipped.

### Deploy (Vercel)
1. Sign in to Vercel with GitHub, **Add New Project**, import this repo, framework **Vite**.
2. In Project Settings > Environment Variables add `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_PROVIDER`, `AI_TIMEOUT_MS` and `AI_MAX_TOKENS`, then deploy.
3. Redeploy after any env var change. Every push to `main` deploys automatically.

`vercel.json` keeps the single-page-app rewrite and sets a 30 s `maxDuration` for both functions; a test checks that every listed file exists.

### Privacy
There are no accounts and no database. Your profile is one JSON document in your browser's localStorage and is never stored on our server. Only the text you paste into an AI feature, or the tool results the advisor needs, is sent to the model. Files you load are read in your browser only. Use **Reset data** (page footer) to delete everything. Do not enter real personal information in the demo.

## Screenshots / demo
_Screenshots coming._ A 2-minute demo script is in [DEMO.md](DEMO.md).

## What's not done yet
- The items marked unverified in **Assumptions** need confirmation from the student's department.
- **Future work: login and cloud sync.** Data lives only in this browser today, so there is no sync between devices. A simple email login with a small database is the planned next step, after a privacy review.
- **Photo import is turned off** (`src/config/features.js`): a test request with an image to this model returned an API error, so it is unverified. Pasting text works, and you can load a `.txt` or `.csv` file.
- The Gemma license is to be confirmed from the official Gemma page.
- Semesters 6 to 8 of the CSE curriculum are empty: add courses or import them.

## Credits
Built with help from Claude Code. I reviewed the code and can explain it. Gemma by Google. Hacktoberfest Hack Day Chittagong × IEEE CS IIUC SBC.
