# Dear Comrade (డియర్ కామ్రేడ్ / डियर कॉमरेड)

> ## A smart, zero-friction health link for NRI children and their parents back home.
> 
> 
> Dear Comrade helps NRI professionals monitor their aging parents' health without forcing them to navigate confusing portals or app stores. Parents simply WhatsApp a picture of their lab report, and the system instantly responds with a warm, comforting voice note in their native tongue (Telugu/Hindi). At the exact same time, the child gets a clean, structured health breakdown summary delivered directly to their WhatsApp, instantly synchronizing with an interactive tracking web dashboard.

---

## 📌 Project Overview

When a parent photographs a physical lab report via standard **WhatsApp**, the system intercepts the media payload and forks into a split-target delivery pipeline:

1. **To Parent (Immediate & Interactive):** Delivers a permanent, personalized WhatsApp audio note using warm, conversational, code-mixed native syntax (**Telugish / Hinglish**) generated via **Sarvam AI**.
2. **To NRI Child (One-Time & Informational):** Delivers an English medical executive summary on WhatsApp and updates a unified web dashboard.
3. **Daily Routine Layer (Parent Only):** Every morning at 8:00 AM IST, a background cron engine dispatches tailored lifestyle and hydration reminders exclusively to the parent based on their extracted anomalies—keeping the child's inbox clear.

**Dear Comrade** is an event-driven asynchronous pipeline that bridges dense clinical data with non-tech-savvy aging parents in India.

---

## 👩‍💼 Real-World Example: Sudha (Texas) & Her Father (Hyderabad)

> “Sudha is in Texas working long hours, constantly worrying about her elderly father living alone in Hyderabad. Her father returns from a clinic with a complex 3-page medical report full of intimidating metrics like *HbA1c* and *Serum Creatinine*.
> Instead of facing a confusing patient portal, he takes a quick photo of the paper on WhatsApp and sends it to **Dear Comrade**.
> Within 90 seconds, he receives a WhatsApp message with a permanent voice note. A natural, local Telugu voice explains: *'Namaste andi. Mee blood report nenu chasanu. Mee Sugar levels control lone unnay, kani mee Creatinine level 1.4 koncham high undi. Doctor garu cheppinattu roju manchi ga neellu thagandi.'*
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
[Parent WhatsApp Image Upload] ──> [Twilio Messaging API] ──> (Fast HTTP ACK 200) ──> [NestJS Gateway]
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
                                     [Sarvam AI Pipeline]
                                  (Mayura Script + Bulbul TTS)
                                                 │
                                     [Supabase / PostgreSQL]
                                        (Time-Series State)
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼ (Postgres Realtime)                             ▼ (State Router)
            [Next.js 15 UI Dashboard]                         [Dynamic Language Router]
           (Instant Recharts Rendering)                                   │
                                                        ┌─────────────────┴─────────────────┐
                                                        ▼                                   ▼
                                               [Split-Target Dispatch Engine]      [Cron/Recurring Engine]
                                                        │                                   │
                                                        ▼                                   ▼
                                           [To NRI Child via WhatsApp]         [To Parent via Twilio Audio]
                                           • English Clinical Summary.         • Custom Daily Audio Reminders.

```

---

## 🛠️ Tech Stack & Engineering Rationale

| Architecture Layer | Technology | Engineering Selection Reason |
| --- | --- | --- |
| **Monorepo Orchestrator** | **Turborepo** | Enforces a unified TypeScript workspace so frontend and backend seamlessly share type definitions and Zod validation schemas. |
| **Frontend Platform** | **Next.js 15 (App Router)** | Powers the tracking interface with Server Actions and optimal asset caching layout. |
| **Enterprise Backend** | **NestJS 10+** | Solid dependency-injected framework architecture that cleanly isolates microservices. |
| **Async Task Manager** | **BullMQ + Redis** | Offloads OCR, complex translations, and speech streaming to background threads, protecting HTTP gateway availability. |
| **Messaging & Voice** | **Twilio API** | Industry-standard reliability for WhatsApp Business messaging and media transmission in India. |
| **Sovereign Speech AI** | **Sarvam AI (Mayura & Bulbul V3)** | **Native pipeline:** Mayura for culturally aware code-mixed script generation and Bulbul V3 for high-fidelity regional TTS streaming. |
| **Inference Framework** | **Gemini 2.5 Flash** | Supports native `responseSchema` forcing deterministic structural JSON extractions exactly at the model boundary. |
| **Database & Security** | **Supabase (PostgreSQL)** | Combines relational time-series grouping with Row-Level Security (RLS) for clinical data isolation. |

---

## 📋 Telephony & State Machine Logic

* **`MEDIA_INGESTED`**: Capture Twilio inbound WhatsApp media webhooks, emit fast `jobId` confirmation, and append to processing queue.
* **`METRIC_EXTRACTED`**: Invoke Gemini Flash to map medical values into strictly typed biometric objects.
* **`SCRIPT_LOCALIZED`**: Use **Sarvam Mayura** to transform clinical data into a conversational, code-mixed native script (e.g., Telugu/Hindi) designed for elders.
* **`AUDIO_STREAMED`**: Use **Sarvam Bulbul V3** to convert the localized script into a warm, natural audio file for permanent storage.
* **`LEDGER_PERSISTED`**: Commit time-series points to PostgreSQL; triggers real-time data sync vectors across connected dashboard clients.
* **`PIPELINE_RESOLVED`**: Fire off the structured multi-channel delivery payload (English summary to child, Voice note to parent via Twilio).
* **`CRON_RECURRING_FIRED`**: Trigger daily 08:00 IST BullMQ workers to batch process personalized, non-intrusive health habit reminders.

---

## 🚀 What I Learned from this Project:

-

---
