# Lokkho — a CGPA goal tracker for university students

## The problem
Students do not know what marks they need to reach their goal CGPA. They find out after results and get upset. Retake and improvement rules are confusing, and every department and semester has different courses.

## The solution
Pick your program and current semester, tick the courses you registered, enter your goal CGPA and past results. Lokkho then shows what you need next: the average GPA required, the marks needed in the remaining parts of each course (for example how many of the 50 final marks), and which retake raises your CGPA most. Gemma reads messy input (registration slips, marking schemes, what-if questions), writes kind study tips, and powers an **AI Advisor** that answers questions such as "Can I reach my target?" or "Should I retake something?" using the app's own tools.

**All grade maths is plain, tested code. The AI model never calculates grades.** If the AI is down, everything still works by hand.

## How it works
In plain words: the browser keeps one JSON profile (in localStorage). A deterministic engine (`src/engine/`) computes GPA, CGPA, goal math, marks needed, retake gains and exam alerts from one config file (`src/config/grading.config.js`). The server (`api/ai.js`) only forwards pasted text to Gemma, asks for JSON, validates it against a strict schema, and returns it for you to **review and edit before anything is saved**. Study tips get only the engine's numbers, and any tip that contains a number or grade that was not in its input is hidden.

### AI Advisor (agent)
The Advisor tab is a small chat. You ask a question (or press one of four quick buttons: *Can I reach my target?*, *Predict my result*, *What should I get in each course?*, *Should I retake something?*). Gemma decides which **tool** to call, the tool runs **in your browser on your own data**, Gemma reads the result and explains it in plain, kind language (English or Bangla). Each tool used is shown as a small step under the answer.

**The model never does math.** Every number comes from a plain JavaScript tool in `src/advisor/tools/` (one file per tool, listed in `src/advisor/registry.js` with name, description and argument schema):

| Tool | What it returns |
| --- | --- |
| `get_summary` | current CGPA, credits done and left, target CGPA |
| `required_avg` | GPA needed on the remaining credits; says clearly when the target is impossible |
| `marks_needed` | for one course, marks needed in the remaining components for each grade |
| `plan_courses` | a target grade and marks needed for every current course |
| `predict_result` | best, likely and worst semester GPA and CGPA, with the assumptions listed |
| `simulate_retake` | new CGPA if a course is retaken or improved with grade X, or a ranking of retakes |
| `exam_alerts` | mid and final exams in the next 30 days |
| `propose_target` | a *proposal* (new goal CGPA or a course target grade); nothing changes until you press **Apply** |

**How the loop works.** `api/agent.js` is stateless and only asks the model for the *next step*. Function calling is not used; the model follows a prompt-based JSON protocol: `{"tool": name, "args": {...}}` or `{"final": "text"}`. The browser (`src/advisor/runAgent.js`) runs the loop with at most **6 tool calls** per question, one model call of at most 25 seconds per step, and sends only tool results (numbers) back, never the full profile. Bad tool arguments come back to the model as an error it can fix.

**Safety checks.**
- *Grounding check* (`src/advisor/grounding.js`): every number in the final answer must appear in a tool result. If not, the model is asked once to fix its draft; if it still invents numbers, a warning chip lists them. (Whole numbers up to 10, list markers, course codes and the 4.00 scale are not counted as claims.)
- *Write actions are proposals only* with Apply and Dismiss buttons.
- Pasted or typed text is wrapped as untrusted data inside delimiters; server-side validation of every field; input size limits; best-effort in-memory rate limit per IP; the API key stays on the server.
- Predictions are estimates. *Likely* assumes you keep scoring the same share of marks as so far (70% if nothing is marked), *best* assumes full marks on what is left, *worst* assumes 40% of the remaining marks. These are simple assumptions in `src/advisor/config.js`, not facts.

For the Gemma model on the Gemini API, agent calls use `thinkingLevel: minimal` to keep each step to a few seconds (set `AI_THINKING=off` if you use a model that rejects it).

**Model(s) used:** `gemma-4-26b-a4b-it`, an open-weight Gemma model by Google, called through the Gemini API with a key from Google AI Studio ([model page](https://ai.google.dev/gemma)). License: see the official Gemma terms of use on that page (to be confirmed before submission). Optional local mode: run an open model with LM Studio or Ollama and set `AI_PROVIDER=openai_compat`, `AI_BASE_URL`, `AI_MODEL`.

**Tech stack:** React + Vite (plain JavaScript, plain CSS), Vitest, Vercel serverless functions (`api/ai.js`, `api/agent.js`: 2 functions).

**Datasets:** none. Sample data only; no real student information is in this repo.

### Important: defaults, not official rules
- The **CSE curriculum** is based on one IIUC batch's results page. Other batches may differ. **Verify with your department.** The **BBA curriculum is a SAMPLE** with invented courses.
- The grade scale is a shared default. Points for A+ to C+ were seen on a real result page. **Unverified:** points for C, D and F, the marks range per grade, the retake rule (default: latest attempt replaces the earlier one), and attempted-versus-earned credits (default: earned excludes failed courses). Grade W (withdrawn) is excluded from credits and GPA. All of this is editable in `src/config/grading.config.js`.
- GPA and CGPA are shown with 3 decimals; rounding is for display only.

## How to run it
```bash
nvm use            # Node 20
npm install
cp .env.example .env.local   # then fill GEMINI_API_KEY yourself
npm run dev        # app + the same API handlers, no Vercel login needed
npm test
npm run build
npm run check:secrets
```
Environment variables (server side only, never `VITE_`): `AI_PROVIDER` (`gemini` or `openai_compat`), `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_TOKENS`, `AI_THINKING` (optional).

Privacy: there are no accounts and no database. Your profile is one JSON document in your browser's localStorage and is never stored on our server. Only text you paste into an AI feature, or the numbers the advisor needs, is sent to the model. Use "Reset data" (page footer) to delete it. Do not enter real personal information in the demo.

## Screenshots / demo
_To be added in `docs/screenshots/`._

## What's not done yet
- Items still marked unverified above need confirmation from the student's department.
- Data lives only in this browser (no sync between devices).
- Photo import is optional and may be incomplete.
- Screenshots and the live Vercel deployment are still to do.
- The GitHub Actions workflow is kept in `ci-pending/ci.yml` until the push token has the `workflow` scope.

## Credits
Built with help from Claude Code. I reviewed the code and can explain it. Gemma by Google. Hacktoberfest Hack Day Chittagong × IEEE CS IIUC SBC.
