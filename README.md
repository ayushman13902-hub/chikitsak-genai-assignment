# Chikitsak GenAI assignment


Chikitsak is a standalone family-care coordination prototype created for this GenAI assignment. It helps adult children divide existing routine reminders between two family members while keeping clinical decisions outside the system.


The project includes a one-page landing experience, an interactive care-loop simulation and a working weekly planner. The planner uses Gemini to assign routine tasks, Supabase to store requests and usage aggregates, and Vercel for hosting and serverless functions.


## Deploy


1. Create the authorized public GitHub repository `chikitsak-genai-assignment` and upload this project's contents, including dotfiles. Do not upload any `.env` containing values.
2. In a Supabase project, run `supabase/schema.sql` in SQL Editor. The table has RLS enabled and no browser grants. Only the server-side service role calls the table and RPCs.
3. Import the repository into Vercel. Choose Other framework. `vercel.json` serves `public` and the root `api` functions. No package install dependencies are required.
4. Set `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `APP_SECRET` in Vercel's environment variables. `APP_SECRET` must be a random secret of at least 32 characters. Optional `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`.
5. Deploy. Run the five real visitor examples in `LIVE_VERIFICATION.md`. Confirm model calls, database rows, output tokens and the visible usage number. Save redacted screenshots. Fill the live URL, measured token figures and actual model outputs in the workbook.


`npm test` runs local tests using mocked HTTP responses. They verify request validation, refusals, output validation, stored token accounting, failed-write handling, cookie integrity and read-back. They are not evidence of live Gemini or Supabase integration.


## Data and costs


The page requests only routine categories, recurrence and reminder slots. It never requests names, ages, email addresses, symptoms, medicine names or doses. Invalid free-text input is replaced with a generic refusal marker before storage. Model output contains only task IDs and A/B assignments, which the server validates. The page combines these assignments with the visitor's unchanged frequency and time.


The database records admitted requests, generated outputs or refusal/failure status and token usage. Daily HMAC pseudonyms track visitor and network limits. Raw IP addresses are not stored. A signed cookie limits a visitor to three admitted requests per UTC day. A network limit of ten and global limit of fifty reduce cookie-reset abuse and bound demo cost. The database reserves each request atomically before the model call. Rejected, failed and pending requests consume the allowance. Admissions stopped by a cap do not create model exchanges.


`/api/stats` reads successful requests from Supabase. The page shows weekly checklists created and the most common routine category. These are usage counts, not unique families, proof of health impact or customer testimonials.


The prototype interest form stores an email in the visitor's browser only and says so. It does not claim a real mailing-list signup.


## Documentation


- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Vercel Node functions: https://vercel.com/docs/functions/runtimes/node-js
- Vercel project configuration: https://vercel.com/docs/project-configuration/vercel-json
- Supabase database functions: https://supabase.com/docs/guides/database/functions


## Live assignment deployment


- Site: https://chikitsak-genai-assignment.vercel.app
- Source: https://github.com/ayushman13902-hub/chikitsak-genai-assignment
- Runtime: Vercel Functions + Gemini 3.5 Flash Lite + Supabase


Live verification on 6 October 2026 recorded ten admitted requests: five safe failures while the retired Gemini 2.5 endpoint was diagnosed, followed by four successful checklists and one genuine model refusal after migration to Gemini 3.5 Flash Lite. The successful rows contain real input/output token counts. The next request returned the expected network-limit 429 response. No secrets are included in this repository.

