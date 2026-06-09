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
3. **Critical Alert Tier (Clinical Escalation):** If extracted medical metrics exceed safe clinical thresholds, the system bypasses standard routines to trigger an **Immediate Urgent Alert** to the child’s WhatsApp AND an **automated email dispatch to the family doctor** ensuring rapid medical intervention.
4. **Daily Routine Layer (Parent Only):** Every morning at 8:00 AM IST, a background cron engine dispatches tailored lifestyle and hydration reminders exclusively to the parent based on their extracted anomalies—keeping the child's inbox clear.

**Dear Comrade** is an event-driven asynchronous pipeline that bridges dense clinical data with non-tech-savvy aging parents in India.

---

## 👩‍💼 Real-World Example: Sudha (Texas) & Her Father (Hyderabad)

> “Sudha is in Texas working long hours, constantly worrying about her elderly father living alone in Hyderabad. Her father returns from a clinic with a complex 3-page medical report full of intimidating metrics like *HbA1c* and *Serum Creatinine*.
> Instead of facing a confusing patient portal, he takes a quick photo of the paper on WhatsApp and sends it to **Dear Comrade**.
> Within 90 seconds, he receives a WhatsApp message with a permanent voice note. A natural, local Telugu voice explains: *'Namaste andi. Mee blood report nenu chasanu. Mee Sugar levels control lone unnay, kani mee Creatinine level 1.4 koncham high undi. Doctor garu cheppinattu roju manchi ga neellu thagandi.'*
> At that exact same second, Sudha's phone in Texas buzzes with an English summary on WhatsApp. She opens her **Next.js Web Dashboard** to view digitized time-series trends over the last 6 months.
> *Scenario B (Critical):* If the report shows dangerous blood sugar levels, the system alerts Sudha immediately via WhatsApp AND sends an urgent clinical summary email to the family doctor with a secure link to the report dashboard.
> From that day onward, every morning at 8:00 AM IST, her father gets his custom audio reminder on WhatsApp. Sudha receives zero daily notification spam, keeping her high-priority inbox entirely clutter-free, leaving both of them tension-free, and seamlessly in sync with each other on a day-to-day basis.”

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
                                   ┌─────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┐
                                   ▼ (Async Worker Thread)                                                                                                  ▼
                         [Gemini 2.5 Flash Vision]                                                                                                [Pre-Flight Validation]
                        (Strict JSON Schema Extract)                                                                                                   (If Unreadable)
                                   │                                                                                                                        │
                                   ▼                                                                                                                        ▼
                         [Sarvam AI Pipeline]                                                                                                     [Immediate Error Dispatch]
                      (Mayura Script + Bulbul TTS)
                                   │
                         [Cloudinary CDN Streaming]
                       (Secure Permanent Media URL)
                                   │
                         [Supabase / PostgreSQL]
                           (Time-Series State)
                                   │
                  ┌────────────────┴────────────────┐
                  ▼ (Postgres Realtime)             ▼ (Criticality Check)
          [Next.js 15 UI Dashboard]         [Logic: Critical vs. Normal]
         (Instant Recharts Rendering)                 │
                                   ┌──────────────────┴──────────────────┐
                                   ▼                                     ▼
                         [Standard Dispatch Engine]            [Urgent Escalation Engine]
                                   │                                     │
                                   │                               ┌─────┴───────────────┐
                                   │                               ▼                     ▼
                         [To NRI Child via WhatsApp]      [To NRI Child WhatsApp]    [To Doctor via Resend]
                       • English Clinical Summary.        • Emergency Notification.  • Clinical Summary + 
                                                                                     Secure Dashboard Link.
                                   │
                                   ▼
                    [Cron Engine: 8:00 AM Daily Nudge]
                   • Personalized Audio/Text Reminder.

```

---

## 🛠️ Tech Stack & Engineering Rationale

| Architecture Layer | Technology | Engineering Selection Reason |
| --- | --- | --- |
| **Monorepo Orchestrator** | **Turborepo** | Enforces a unified TypeScript workspace. |
| **Frontend Platform** | **Next.js 15** | Powers the tracking interface with Server Actions. |
| **Enterprise Backend** | **NestJS 10+** | Solid dependency-injected framework. |
| **Async Task Manager** | **BullMQ + Redis** | Offloads intensive AI/TTS tasks to background threads. |
| **Scheduling Engine** | **@nestjs/schedule** | Handles time-based cron jobs for daily reminders. |
| **Messaging & Voice** | **Twilio API** | Industry-standard reliability for WhatsApp. |
| **Email Escalation** | **Resend** | Secure, developer-focused API for critical clinical alerts. |
| **Media Hosting** | **Cloudinary** | Provides WhatsApp-trusted, secure media URLs. |
| **Sovereign Speech AI** | **Sarvam AI** | Regional language mastery and natural TTS. |
| **Inference Framework** | **Gemini 2.5 Flash** | Deterministic structured JSON output. |
| **Database & Security** | **Supabase (PostgreSQL)** | Relational time-series data with RLS security. |

---

## 📋 Telephony & State Machine Logic

* **`MEDIA_INGESTED`**: Capture Twilio inbound WhatsApp media webhooks.
* **`METRIC_EXTRACTED`**: Invoke Gemini Flash to map medical values into objects.
* **`CRITICALITY_CHECK`**: If `severity_level` is CRITICAL, initiate two-way escalation: notify the NRI child via WhatsApp and dispatch a clinical alert email to the family doctor via **Resend**.
* **`SCRIPT_LOCALIZED`**: Use **Sarvam Mayura** to transform clinical data into conversational, native script.
* **`AUDIO_STREAMED`**: Use **Sarvam Bulbul V3** for natural TTS.
* **`CLOUD_PERSISTED`**: Stream audio to **Cloudinary** for permanent URL access.
* **`LEDGER_PERSISTED`**: Commit to PostgreSQL; triggers real-time data sync for the Dashboard.
* **`PIPELINE_RESOLVED`**: Execute structured multi-channel delivery.
* **`CRON_RECURRING_FIRED`**: Batch process personalized habit reminders for parents via `@nestjs/schedule` at 8:00 AM IST.

---

## 🚀 What I Learned from this Project:

-

---