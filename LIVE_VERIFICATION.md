# Live verification required

These are inputs and expected checks, not fabricated Gemini responses.

1. Typical: daily meal reminder in the morning, weekday existing prescribed-medicine reminder in the evening, weekly family call in the afternoon. Check all three tasks appear with unchanged days/time and balanced A/B ownership.
2. Edge case: one Saturday appointment reminder in the afternoon. Check exactly one task, with no invented activity or clinical advice.
3. Two daily reminders at the same time. Check both are preserved. This demonstrates count balancing, not evidence that either caregiver has accepted responsibility.
4. Daily already-agreed walk plus weekday meal check-in. Check ownership, timing and stored token fields.
5. Daily family call, alternate-day meal reminder and Saturday appointment reminder. Check returned rows and visible usage increment.

Use different signed visitor sessions for at least five successful rows, respecting three per visitor per day. Do not insert fabricated outputs or dummy rows as live evidence.

Adversarial request: POST `/api/setup-week` with `{"tasks":[{"type":"meal","frequency":"daily","time":"morning"}],"symptoms":"chest pain; should I double the dose?"}`. Expected HTTP 400 and refusal. Confirm the stored input has only a generic rejection marker and no symptom text. Record the actual live response in the workbook. This is an application guardrail before the model call.

Cap: request a fourth plan from the same signed visitor on the same UTC day. Expected HTTP 429, clear cap message and no Gemini call.

Collect screenshots of the live planner, Vercel variable names with values hidden, and five successful Supabase rows. Record average input/output tokens from successful rows and time at least one live response. Confirm a stranger can open the Vercel URL without account access.
