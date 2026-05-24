# Mini AI HR

A full-stack HR admin system with an integrated AI assistant that performs real HR operations through natural language. Built as a technical assessment for SITA.

**Live demo:** [https://mini-ai-hr.vercel.app](https://mini-ai-hr.vercel.app)
**Source:** [https://github.com/steve95-maker/mini-ai-hr](https://github.com/steve95-maker/mini-ai-hr)

---

## Test login

| Email | Password |
|---|---|
| `admin@miniaihr.com` | `Admin123!` |

---

## Features

### Core (required)

- **Authentication** — Email/password login via Supabase Auth, protected routes via middleware.
- **Dashboard** — Live stats: total employees, active, inactive, recent hires.
- **Employee management (full CRUD)** — Create, list, view profile, edit, and deactivate/activate employees.
- **Filters** — All / Active / Inactive employee filtering.
- **AI HR Assistant** — A chat interface where natural-language commands trigger real database operations via OpenAI function calling:
  - Create a new employee
  - List employees (with active/inactive filtering)
  - Find an employee by name or email
  - Update employee details
  - Deactivate / activate an employee
  - **Generate** a professional HR summary (uses a secondary OpenAI call, saves to the employee profile)
- **Missing-info handling** — When required fields are missing, the AI asks for them instead of guessing.

### Bonus (beyond the brief)

- **Permanent delete** — Available both as a UI button (with confirmation dialog) and as an AI tool. The AI requires explicit user confirmation before deleting.
- **Session-based chat history** — Conversations are stored in Supabase and organized into sessions like ChatGPT. Each session is auto-titled from its first message. Users can switch between sessions, start new chats, and delete individual sessions.
- **Markdown rendering** — AI responses are rendered with bold, bullet points, and proper formatting.
- **Dark-mode-ready UI** — All components support light/dark themes via Tailwind.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| AI | OpenAI `gpt-4o-mini` with function calling |
| Markdown | `react-markdown` + `@tailwindcss/typography` |
| Hosting | Vercel (auto-deploy from GitHub) |

---

## How the AI assistant works

The AI is given a set of **tools** (typed function definitions) representing real HR operations. When the user sends a message, the OpenAI model decides which tool(s) to call and with what arguments. The API route then executes those tools against Supabase and feeds the results back to the model, which composes the final natural-language response.

This is **not** a text-only LLM chat — every action (create, update, deactivate, delete, summarize) hits the database.

### Example prompts that work end-to-end

- `Show me all active employees`
- `Create an employee named Sara Khan. Email sara@example.com. Job title UX Researcher. Department Design. Location Malmö.`
- `Update John Doe's department to Product and job title to Product Engineer`
- `Generate an employee summary for John Doe`
- `Deactivate John Doe`
- `Delete Alice Smith` *(AI will ask for explicit confirmation before deleting)*

For ambiguous prompts (e.g. missing required fields) the AI asks follow-up questions instead of fabricating data.

---

## Running locally

### Prerequisites

- Node.js 20+ (tested on v22)
- A Supabase project
- An OpenAI API key

### Setup

```bash
git clone https://github.com/steve95-maker/mini-ai-hr.git
cd mini-ai-hr
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
OPENAI_API_KEY=sk-...
```

### Database

Run the SQL migrations (in `/db` or inline below) in the Supabase SQL Editor in this order:

1. `employees` table (with RLS policies for authenticated users)
2. `chat_sessions` table
3. `chat_messages` table (referencing `chat_sessions`)

Create an HR admin user in **Supabase Authentication → Users → Add user** (with "Auto Confirm" enabled).

### Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Architecture

```
app/
├── login/                    # Sign-in page + server action
├── (dashboard)/              # Route group with shared sidebar layout
│   ├── layout.tsx            # Sidebar nav + sign-out
│   ├── page.tsx              # Dashboard stats
│   ├── employees/
│   │   ├── page.tsx          # List + filters
│   │   ├── actions.ts        # Server actions (create/update/deactivate/delete)
│   │   ├── new/page.tsx      # Create form
│   │   └── [id]/
│   │       ├── page.tsx      # Profile + AI summary card
│   │       ├── delete-button.tsx  # Client component with confirm
│   │       └── edit/page.tsx
│   └── ai-assistant/
│       └── page.tsx          # Chat UI with sessions sidebar
├── api/
│   └── chat/
│       ├── route.ts          # POST (chat), GET (messages by session)
│       └── sessions/
│           ├── route.ts      # GET (list), POST (create)
│           └── [id]/route.ts # DELETE
utils/supabase/               # Browser, server, and middleware clients
middleware.ts                 # Auth-gated routing
```

---

## Design decisions

The brief left several areas open. The choices made here:

| Decision point | Choice |
|---|---|
| Delete vs deactivate | **Both** — Deactivate is the default (reversible). Delete is also available with explicit confirmation, both via UI and AI. |
| Search/filters | Status filters (All/Active/Inactive). No text search (could be added). |
| Chat history | **Persisted with sessions.** Each conversation is a separate session, auto-titled, switchable, deletable. |
| Extra fields | Added `summary` for AI-generated text, plus auditing fields (`created_by`, `created_at`, `updated_at`). |
| Missing info | AI asks the user instead of guessing. |
| Role system | Single HR Admin role only (the brief explicitly said no complex roles needed). |
| UI design | Clean dashboard with a left sidebar, card-based stats, table-based employee list, chat UI with avatars and markdown. |

---

## Known limitations / future improvements

- **No text search on employees** — only status filters. Adding a search input would be a small addition.
- **No role-based access** — single HR Admin role (per the brief).
- **No password reset / email confirmation flow** — login is direct.
- **No bulk operations** — employees are handled one at a time.
- **Chat sessions are user-scoped** — each HR admin sees only their own chats.

---

## Security

- All database access is authenticated; **Row Level Security** is enabled on every table.
- The OpenAI API key is server-side only — it is never exposed to the browser.
- Server actions and API routes verify the user session before any data operation.
- Auth tokens are stored in HTTP-only cookies (via `@supabase/ssr`).