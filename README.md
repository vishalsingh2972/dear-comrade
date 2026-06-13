# Dear Comrade (డియర్ కామ్రేడ్ / डियर कॉमरेड)

> **A smart, zero-friction health link for NRI children and their parents back home, powered by Sarvam AI.**

Dear Comrade is an event-driven medical intelligence pipeline that bridges dense clinical data with non-tech-savvy aging parents in India. By leveraging Sarvam’s state-of-the-art Indic language models, we transform intimidating lab reports into warm, conversational, and personalized voice notes in native languages.

---

## 📌 Project Overview

When a parent photographs a physical lab report via standard **WhatsApp**, the system intercepts the media and initiates a Sarvam-native intelligent pipeline:

1. **Multimodal Understanding:** Extracts structured clinical data from complex, multi-page lab reports, preserving table structures and medical terminology.
2. **Conversational Localization:** Employs **Sarvam Mayura** (LLM) to transform raw clinical data into natural, code-mixed native speech (**Telugish/Hinglish**), capturing the empathy required for elderly health communication.
3. **Human-Like Voice Synthesis:** Uses **Sarvam Bulbul (v3)** to synthesize high-fidelity, emotionally resonant audio notes that ensure critical medical instructions are retained.
4. **Clinical Escalation:** A critical-threshold engine automatically triggers alerts to the NRI child via WhatsApp and dispatches structured clinical reports to family doctors via **Resend**.

---

## 🧠 Core System Processing Lifecycle

```txt
[WhatsApp Image] ──> [Twilio Webhook] ──> [BullMQ Worker] ──> [OCR/Extraction Layer]
                                                                        │
                                                             [Sarvam Mayura (Logic + Script)]
                                                                        │
                                                             [Sarvam Bulbul (TTS Synthesis)]
                                                                        │
                                                  ┌─────────────────────┼─────────────────────┐
                                                  ▼                     ▼                     ▼
                                     [To Parent (WhatsApp Audio)]  [To Child (WhatsApp)] [To Doctor (Resend Email)]
                                                                        │
                                                              [Supabase/Dashboard Sync]

```

---

## 💡 How to Evaluate This Project

To see the full pipeline in action, look for these three key components in the code:

* **The Voice Experience:** Check `src/report.processor.ts` to see how we leverage **Sarvam Bulbul v3** to deliver empathetic, code-mixed audio notes.
* **The Critical Alert Logic:** Review the conditional blocks in `src/report.processor.ts` that trigger **Resend** emails when clinical metrics exceed safety thresholds.
* **The Dashboard Integration:** View the Supabase-backed API layer which powers the real-time React dashboard.

---

## 🖥️ Live Dashboard Features (Fully Implemented)

The NRI child dashboard includes:

| Feature | Description |
|---------|-------------|
| **Real-time Report Streaming** | Reports appear instantly via Supabase Realtime |
| **Father/Mother Toggle** | Color-coded themes (Blue for Father, Pink for Mother) |
| **AI Health Summary** | Powered by Sarvam 105B - generates empathetic English summaries |
| **Date Range Filter** | Analyze health trends over specific periods |
| **Critical Alerts** | Red-highlighted reports requiring immediate attention |
| **Email to Doctor** | One-click Gmail compose with pre-filled summary |
| **Export to PDF** | Print-friendly clinical reports for medical consultations |
| **Search & Filter** | Find specific reports by keywords or critical status |
| **Interactive Charts** | Bar chart visualization of report trends over time |

---

## 🚀 Key Engineering Lessons

* **Asynchronous Resilience:** Using **BullMQ + Redis** was critical to handle the latency of multi-modal AI pipelines. This ensures the parent gets an immediate acknowledgement while the worker handles the heavy lifting.
* **Deterministic Structured Extraction:** Moving from unstructured OCR to structured JSON workflows is the difference between a "text dump" and a "health dashboard."
* **The Empathy Gap:** I learned that in healthcare, **how** information is delivered is as important as **what** is delivered. Code-mixed native language is the primary driver of patient trust and compliance.
* **Hydration & Print Fixes:** Addressed Next.js hydration mismatches and implemented print-based PDF export that captures all reports, including those outside viewport.

---

## 📋 Tech Stack

* **AI/ML:** Sarvam AI (Mayura, Bulbul V3), Google Gemini 2.5 Flash.
* **Backend:** NestJS, BullMQ (Redis-backed background processing).
* **Database:** Supabase (PostgreSQL) with Realtime sync.
* **Integrations:** Twilio (WhatsApp), Cloudinary (Media Streaming), Resend (Clinical Alerts).
* **Frontend:** Next.js 15, Tailwind CSS, shadcn/ui, Recharts (Interactive Dashboard).

---

## ⚙️ Running Locally

1. **Clone the repo:** `git clone [your-repo-link]`
2. **Install dependencies:** `npm install`
3. **Start Infrastructure:** `docker-compose up -d` (This initializes Redis and your PostgreSQL database).
4. **Configure Environment:** 
   - Navigate to `apps/api/` and copy `.env.example` to `.env`. Fill in your AI keys, Twilio, Resend, and Database credentials.
   - Navigate to `apps/web/` and copy `.env.example` to `.env` for your frontend configuration.

5. **Expose your Localhost:** In a new terminal, run `ngrok http 3000`. Copy the generated `https` URL and update the `PUBLIC_URL` in your `apps/api/.env` file.
6. **Run the Apps:**
   - **Backend:** `npm run dev --filter api` (Runs on http://localhost:3000)
   - **Frontend:** `npm run dev --filter web` (Runs on http://localhost:3001)

👉 **Need to test the pipeline?** Use the sample lab report image in the `/sample-reports` folder to trigger the processing flow.

*Note: Ensure your Twilio WhatsApp Sandbox webhook is pointed to `[YOUR_NGROK_URL]/webhook`.*

---

## 🎥 Demo Video

[Link to demo video]

---

## 📝 Blog Post

[Link to blog post](https://docs.google.com/document/d/1uOwlQk6d7ZD5ZJ4lWFOYHA4dUwRsCN5Z/edit?usp=sharing&ouid=113001867272048306232&rtpof=true&sd=true)

---

## 🙏 Acknowledgments

Built with ❤️ using Sarvam AI, Next.js, Supabase, and Twilio. Special thanks to the Sarvam team for their powerful Indic-first language models. ![India](https://raw.githubusercontent.com/stevenrskelton/flag-icon/master/png/16/country-4x3/in.png "India") is proud of you.

---