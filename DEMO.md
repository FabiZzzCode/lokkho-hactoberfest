# Lokkho: 2-minute demo script

Use the **SAMPLE student** (invented data) on the live site. Do not type real personal information.
Before you start: open the site, click **Reset data** if needed, and have the app in English.

## 0:00 to 0:30. The problem (talk, no screen yet)
"Students in Bangladesh usually learn what they needed only after results come out, and then it is too late. Retake rules are confusing, and every department and semester has different courses. Lokkho answers one question before results day: **what exactly do I need to get my goal CGPA?**"

Show the first screen: pick program, semester, goal CGPA. "The course list comes from the department's curriculum. I tick what I registered, and add past results, or paste a whole result page and it fills every semester at once."

## 0:30 to 1:30. Live demo with the sample student (60 seconds)
1. Click **Try a SAMPLE student**. Point at the dashboard: current CGPA **3.373**, goal **3.60**, and "you need an average GPA of **3.675**". (Do not mention exam banners unless they show.)
2. Open the **Advisor** tab. Read the yellow disclaimer: predictions are scenario ranges, not guarantees.
3. Press the four quick buttons, about 12 seconds each:
   - **Can I reach my target?** Shows the steps *Checked your summary* and *Checked required average*. Answer: needs an average GPA of 3.675 on 122.5 remaining credits; best possible CGPA 3.844.
   - **Predict my result.** Step *Predicted your result*. Best 3.577, likely 3.46, worst 3.031 projected CGPA, with the assumptions listed.
   - **What should I get in each course?** Step *Planned your courses*. Target grade A in each course with the marks needed (for example 34 of the remaining 50 in Data Structures).
   - **Should I retake something?** Step *Simulated retake*. Retaking Discrete Mathematics with an A lifts CGPA from 3.373 to 3.466.
4. Optional, if time: type "Set my goal to 3.7". A **Proposal** card appears. "Nothing changed until I press Apply." Press **Dismiss**.
5. Switch language to **বাংলা** to show the same app in Bangla.

If the AI is slow or busy, say so honestly: the error message appears and every number is still available on the Dashboard and Courses pages without the AI.

## 1:30 to 2:00. How it works (30 seconds)
"All maths is plain, tested JavaScript: GPA, goal math, marks needed, predictions and retake gains. **Gemma never calculates.** It does three things: it reads messy pasted text into JSON that you review before saving, it chooses which tool to call, and it explains the tool results kindly in English or Bangla.

The browser runs the loop, at most 6 tool calls per question. After the answer, a **grounding check** compares every number in the text with the tool results. If one is invented, the model gets one chance to fix it, otherwise you see a warning. Write actions are only proposals. Your data stays in your browser's localStorage; there is no account and no database. The model is Gemma, called through the Gemini API, with a local mode through LM Studio or Ollama."

## Likely questions
- **Is the model open?** Google publishes Gemma's weights; the demo calls it through Google's hosted API, and local mode runs it on your own machine. The exact license is still to be quoted from the official page.
- **Are the grading rules official?** No. They are editable defaults in `src/config/grading.config.js`; unverified ones are listed under Assumptions in the README.
- **What if the AI makes up a number?** The grounding check catches numbers that are not in a tool result and shows a warning chip.
- **What is next?** Login and cloud sync, then verified rules per university.
