# Lokkho — a CGPA goal tracker for university students

## The problem
Students do not know what marks they need to reach their goal CGPA. They find out after results and get upset. Retake and improvement rules are confusing, and every department and semester has different courses.

## The solution
Pick your program and current semester, tick the courses you registered, enter your goal CGPA and past results. Lokkho then shows what you need next: the average GPA required, the marks needed in the remaining parts of each course (for example how many of the 50 final marks), and which retake raises your CGPA most. Gemma reads messy input (registration slips, marking schemes, what-if questions) and writes kind study tips.

**All grade maths is plain, tested code. The AI model never calculates grades.** If the AI is down, everything still works by hand.

## How it works
In plain words: the browser keeps one JSON profile (in localStorage). A deterministic engine (`src/engine/`) computes GPA, CGPA, goal math, marks needed, retake gains and exam alerts from one config file (`src/config/grading.config.js`). The server (`api/ai.js`) only forwards pasted text to Gemma, asks for JSON, validates it against a strict schema, and returns it for you to **review and edit before anything is saved**. Study tips get only the engine's numbers, and any tip that contains a number or grade that was not in its input is hidden.

**Model(s) used:** `gemma-4-26b-a4b-it`, an open-weight Gemma model by Google, called through the Gemini API with a key from Google AI Studio ([model page](https://ai.google.dev/gemma)). License: see the official Gemma terms of use on that page (to be confirmed before submission). Optional local mode: run an open model with LM Studio or Ollama and set `AI_PROVIDER=openai_compat`, `AI_BASE_URL`, `AI_MODEL`.

**Tech stack:** React + Vite (plain JavaScript, plain CSS), Vitest, Vercel serverless functions (`api/`), optional MongoDB Atlas for sync.

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
Environment variables (server side only, never `VITE_`): `AI_PROVIDER` (`gemini` or `openai_compat`), `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_TOKENS`, `MONGODB_URI`, `MONGODB_DB`.

Privacy: profile data stays in your browser unless you turn on cloud sync. With sync, the server stores only a hash of your random profile code, and **anyone who has the code can read that data**. Do not share it and do not enter real personal information in the demo.

## Screenshots / demo
_To be added in `docs/screenshots/`._

## What's not done yet
- Items still marked unverified above need confirmation from the student's department.
- Cloud sync (`api/profile.js`) is built and unit-tested against an in-memory store, but not yet tried against a live MongoDB Atlas cluster.
- Photo import is optional and may be incomplete.
- Screenshots and the live Vercel deployment are still to do.
- The GitHub Actions workflow is kept in `ci-pending/ci.yml` until the push token has the `workflow` scope.

## Credits
Built with help from Claude Code. I reviewed the code and can explain it. Gemma by Google. Hacktoberfest Hack Day Chittagong × IEEE CS IIUC SBC.
