# Dear Comrade (డియర్ కామ్రేడ్ / डियर कॉमरेడ్)

> ## A smart, zero-friction health link for NRI children and their parents back home.
> 
> 
> Dear Comrade helps NRI professionals monitor their aging parents' health without forcing them to navigate confusing portals or app stores. Parents simply WhatsApp a picture of their lab report, and the system instantly responds with a warm, comforting voice note in their native tongue (Telugu/Hindi). At the exact same time, the child gets a clean, structured health breakdown summary delivered directly to their WhatsApp, instantly synchronizing with an interactive tracking web dashboard.

---

## 📌 Project Overview

When a parent photographs a physical lab report via standard **WhatsApp**, the system intercepts the media payload and forks into a split-target delivery pipeline:

1. **To Parent (Immediate & Interactive):** Delivers a permanent, personalized WhatsApp audio note using warm, conversational, code-mixed native syntax (**Telugish / Hinglish**).
2. **To NRI Child (One-Time & Informational):** Delivers an English medical executive summary on WhatsApp and updates a unified web dashboard.
3. **Daily Routine Layer (Parent Only):** Every morning at 8:00 AM IST, a background cron engine dispatches tailored lifestyle and hydration reminders exclusively to the parent based on their extracted anomalies—keeping the child's inbox clear.

**Dear Comrade** is an event-driven asynchronous pipeline that bridges dense clinical data with non-tech-savvy aging parents in India.

---

## 👩‍💼 Real-World Example: Sudha (Texas) & Her Father (Hyderabad)

> “Sudha is in Texas working long hours, constantly worrying about her elderly father living alone in Hyderabad. Her father returns from a clinic with a complex 3-page medical report full of intimidating metrics like *HbA1c* and *Serum Creatinine*.
> Instead of facing a confusing patient portal, he takes a quick photo of the paper on WhatsApp and sends it to **Dear Comrade**.
> Within 90 seconds, his phone rings with an interactive outbound call, and he receives a permanent voice note in his WhatsApp chat. A natural, local Telugu voice explains: *'Namaste andi. Mee blood report nenu chasanu. Mee Sugar levels control lone unnay, kani mee Creatinine level 1.4 koncham high undi. Doctor garu cheppinattu roju manchi ga neellu thagandi.'* The IVR prompts him to press 1 for daily health calls or 2 for daily WhatsApp audio notes. He presses 2.
> At that exact same second, Sudha's phone in Texas buzzes with an English summary on WhatsApp. She opens her **Next.js Web Dashboard** to view digitized time-series trends over the last 6 months charted out beautifully via Recharts.
> From that day onward, every morning at 8:00 AM IST, her father gets his custom audio reminder on WhatsApp (*'Good morning Uncle! Mee kidneys safe ga undalante roju 3 liters neellu thagadam marchipokandi!'*). Sudha receives zero daily notification spam, keeping her high-priority inbox entirely clutter-free, leaving both of them tension-free, and seamlessly in sync with each other on a day-to-day basis.”

---

## 💭 The Problem Space

For many NRI professionals living in the US or Europe, managing the medical workflows of aging parents presents major obstacles:

* **Cognitive Friction:** Elderly parents are overwhelmed by dense clinical ranges, causing severe text-retention and health anxiety.
* **Linguistic Rigidness:** Standard LLM translation models use stiff, dictionary-formal translations that sound robotic and fail at conversational "code-mixing" (Hinglish/Telugish).
* **Voice Ephemerality:** Automated calls are fleeting; once the line hangs up, elderly patients cannot re-listen to critical diagnostic instructions.
* **Webhook Timeouts:** Multi-modal extraction, code-mixed translation, and speech synthesis are highly intensive. Handling this synchronously causes HTTP gateway timeouts.

---

## 🧠 Core System Processing Lifecycle

```txt
[Parent WhatsApp Image Upload] ──> [Infobip Omnichannel Edge] ──> (Fast HTTP ACK 200) ──> [NestJS Gateway]
                                                                                               │
                                                                                     (Microservice Enqueue)
                                                                                               ▼
                                                                                     [BullMQ + Redis Queue]
                                                                                               │
                                                 ┌─────────────────────────────────────────────┴─────────────────────────────────────────────┐
                                                 ▼ (Async Worker Thread)                                                                     ▼
                                     [Gemini 2.5 Flash Vision]                                                       [Pre-Flight Blur/Validation Engine]
                                    (Strict JSON Schema Extract)                                                                     │ (If Unreadable)
                                                 │                                                                                   ▼
                                                 ▼                                                                       [Immediate Error Dispatch]
                                     [Supabase / PostgreSQL]
                                        (Time-Series State)
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼ (Postgres Realtime)                             ▼ (State Router)
            [Next.js 15 UI Dashboard]                         [Dynamic Language Router]
           (Instant Recharts Rendering)                                   │
                                                        ┌─────────────────┴─────────────────┐
                                                        ▼                                   ▼
                                               [Telugu Pipeline]                   [Hindi Pipeline]
                                               • Sarvam Mayura                     • Sarvam Mayura
                                               • Bulbul V3 TTS Stream              • Bulbul V3 TTS Stream
                                                        │                                   │
                                                        └─────────────────┬─────────────────┘
                                                                          ▼
                                                      [Split-Target Dispatch Engine]
                                                                          │
                        ┌─────────────────────────────────────────────────┼─────────────────────────────────────────────────┐
                        ▼ (Immediate / One-Time)                          ▼ (Immediate / One-Time)                          ▼ (Daily Recurring @ 8 AM IST)
           [To NRI Child via WhatsApp]                       [To Parent Call & WhatsApp]                       [To Parent Only via Cron Worker]
           • English Clinical Summary text.                  • Native Interactive IVR Call.                    • Custom Daily Audio Habit Reminder.
           • Suppressed from daily routines.                 • Permanent Backup Audio Note.                    • Respects Call vs. WhatsApp pref.

```

---

## 🛠️ Tech Stack & Engineering Rationale

| Architecture Layer | Technology | Engineering Selection Reason |
| --- | --- | --- |
| **Monorepo Orchestrator** | **Turborepo** | Enforces a unified TypeScript workspace so frontend and backend seamlessly share type definitions and Zod validation schemas. |
| **Frontend Platform** | **Next.js 15 (App Router)** | Powers the tracking interface with Server Actions, high-performance client metadata handling, and optimal asset caching layout. |
| **Enterprise Backend** | **NestJS 10+** | Solid dependency-injected framework architecture that cleanly isolates microservices and third-party integrations. |
| **Async Task Manager** | **BullMQ + Redis** | Offloads multi-modal OCR, complex translations, and speech streaming to background threads, protecting HTTP gateway availability. |
| **Messaging & Voice** | **Infobip Omnichannel API** | Enterprise carrier routing stability within India, built-in outbound DTMF IVR script handling, and multi-channel media templates. |
| **Sovereign Speech AI** | **Sarvam AI (Mayura & Bulbul V3)** | Native understanding of regional Indian language structures and code-mixing. Bulbul V3 handles sub-250ms streaming over WebSockets. |
| **Inference Framework** | **Gemini 2.5 Flash / Pro** | Supports native `responseSchema` forcing deterministic structural JSON extractions exactly at the model boundary. |
| **Database & Security** | **Supabase (PostgreSQL)** | Combines excellent relational grouping for time-series charting with Row-Level Security (RLS) for clinical data isolation. |

---

## 📋 Telephony & State Machine Logic

* **`MEDIA_INGESTED`**: Capture Infobip inbound media webhook streams, emit fast `jobId` confirmation, and append to processing queue.
* **`IMAGE_VALIDATED`**: Analyze image contrast, framing, and blur. If unreadable, fail fast and notify the parent immediately.
* **`METRIC_EXTRACTED`**: Invoke Gemini Flash to map medical values into an array of strictly typed biometric objects.
* **`LEDGER_PERSISTED`**: Commit time-series points to PostgreSQL; triggers real-time data sync vectors across connected dashboard clients.
* **`PREFERENCE_CAPTURED`**: Intercept DTMF keypad presses ("Press 1 or 2") during the initial IVR call to store daily delivery channels.
* **`SCRIPT_LOCALIZED`**: Translate English findings into conversational, code-mixed native scripts using Sarvam Mayura.
* **`AUDIO_STREAMED`**: Maintain WebSocket channels with Sarvam Bulbul V3 to compile binary audio buffers into permanent audio files.
* **`PIPELINE_RESOLVED`**: Fire off the structured multi-channel delivery payload (English summary to child, Voice call + audio file to parent).
* **`CRON_RECURRING_FIRED`**: Trigger daily 08:00 IST BullMQ scheduled cron workers to batch process ongoing parent reminders.

---

## 🚀 What I Learned from this Project:


```