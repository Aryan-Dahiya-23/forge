# DocForge

DocForge is a structured, schema-driven document editor designed for writing calm, product-first SOPs, guides, and documentation. Built with a focus on typography, structure, and clean user experience, it features custom block structures, AI-powered writing assistance, and professional publishing exports.

---

## Key Features

- **Schema-Driven Blocks**: Custom-designed structural components like `Step` lists, variant-based `Callout` cards (Note, Tip, Warning), and `Screenshot` layout modules.
- **Drag-and-Drop Reordering**: Smooth, native-feeling drag handle interaction across all top-level structural blocks.
- **AI-Native Editing**: Streams inline suggestions (Rewrite, Expand into Steps, Simplify) using DeepSeek AI directly via ProseMirror transactions.
- **Calm UX & Notifications**: Built with a strict feedback philosophy. Success toasts are omitted for instant actions to prevent notification fatigue, focusing toasts on errors, long-running operations (like PDF generation), and destructive actions.
- **Robust Auto-save & Version History**: Real-time debounced saving with automatic change detection, manual snapshot creation, and full draft restoration.
- **Instant Publishing & Export**: Multi-format exports including standard Markdown, fully-styled standalone HTML, and print-ready PDFs.
- **Starter Templates**: Kickstart documents with pre-configured structures like Onboarding Checklists, Troubleshooting Guides, and Feature Release Notes.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Editor Core**: TipTap & ProseMirror
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS & shadcn/ui
- **AI Provider**: DeepSeek API (OpenAI SDK client)

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aryan-Dahiya-23/forge.git
   cd forge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and fill in your Supabase database credentials and DeepSeek API key:
   ```env
   DATABASE_URL="your-supabase-connection-string"
   DIRECT_URL="your-supabase-direct-migration-string"
   DEEPSEEK_API_KEY="your-deepseek-api-key"
   DEEPSEEK_MODEL="deepseek-chat"
   ```

4. Run Prisma database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the local development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## Project Structure

```
├── prisma/                  # Database schema & migrations
├── src/
│   ├── app/
│   │   ├── api/             # Document CRUD, version snapshots, & AI stream routes
│   │   ├── documents/       # Document list and main Editor routes
│   │   └── globals.css      # Core styles and design system overrides
│   ├── components/
│   │   ├── editor/          # TipTap editor core, plugins, & export controls
│   │   │   └── nodes/       # Custom nodes (Step, Callout, Screenshot)
│   │   ├── layout/          # Document sidebar navigation & shell controls
│   │   └── ui/              # shadcn base design system primitives
│   └── lib/                 # Shared data layers and export helpers
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
