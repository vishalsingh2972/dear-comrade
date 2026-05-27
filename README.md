# Dear Comrade (డియర్ కామ్రేడ్ / डियर कॉमरेड)

> ## AI-Powered Cross-Border Health Localization & IVR Processing Infrastructure
>
> Dear Comrade is an empathetic, asynchronous health utility that allows NRI professionals to effortlessly monitor their elderly parents' complex laboratory reports from across the globe, while delivering highly accessible voice summaries and automated daily routines to the parents back home without introducing any technical friction or app-install barriers.

---

## 📌 Project Overview

**Dear Comrade** is a production-grade asynchronous pipeline designed to bridge the gap between dense, confusing clinical data and non-tech-savvy elderly parents living in India (specifically targeting Telugu and Hindi linguistic regions).

Instead of forcing aging parents to navigate complicated apps, portal logins, or text interfaces, they simply photograph their physical printed lab reports via standard **WhatsApp**. 

The system intercepts the media payload via an event-driven validation layer and forks into a **Dual-Channel Delivery Pipeline**:
1. **To Parent (Immediate & Interactive):** Fires an immediate, interactive voice response (IVR) phone call alongside a persistent WhatsApp audio note using highly localized, warm, code-mixed native audio notes (**Telugish / Hinglish**). The initial IVR call captures the parent's habit tracking preference (Daily Call vs. Daily WhatsApp audio template).
2. **To NRI Child (One-Time & Informational):** Instantly delivers an English clinical executive summary to the adult child's WhatsApp and updates a real-time tracking web dashboard.
3. **Daily Routine Layer (Parent Only):** Every morning at 8:00 AM IST, the background engine synthesizes and dispatches tailored lifestyle, dietary, and hydration reminders exclusively to the parent based on their latest health anomalies, keeping the child's inbox clear and high-signal.

---

## 👩‍💼 Real-World Example: Explaining Dear Comrade to NRI Sudha living in Texas, USA

> “Sudha, you're in Texas working long hours, dealing with intense time zones, and constantly worrying about your elderly father living alone in Hyderabad. He just came home from a diagnostic lab with a complex 3-page blood report full of tiny text and intimidating words like *HbA1c* and *Serum Creatinine*. 
>
> Instead of making him panic or forcing him to figure out an online web portal, he just takes a quick, shaky photo of the paper on WhatsApp and sends it to the **Dear Comrade** number. 
>
> Within 90 seconds, two things happen at once: Your dad's phone rings with a normal voice call, and he simultaneously gets a permanent audio file in his WhatsApp chat. A natural, local Telugu voice says: *'Namaste andi. Mee blood report nenu chasanu. Mee Sugar levels (HbA1c) 8.2 unnay, idi koncham ekkuva undi, kani kangaru padalsina avasaram ledhu. Kani mee Creatinine level 1.4 koncham high undi...'* Over the phone line, the system asks him to press 1 if he wants his daily morning reminders via a quick call, or 2 via a WhatsApp note. He presses 2.
>
> At that exact same millisecond, your phone in Texas buzzes with an English Medical Executive Summary on WhatsApp, highlighting that your dad's creatinine is elevated. You open your clean **Next.js Web Dashboard** and instantly see the digitized, structural trends of his health over the last 6 months charted out beautifully. 
>
> From that day onward, every morning at 8:00 AM IST, your dad gets his custom audio reminder on WhatsApp: *'Good morning Uncle! Mee kidneys safe ga undalante roju 3 liters neellu thagadam marchipokandi!'* You receive zero daily messages, keeping your inbox clutter-free, while your dad gets absolute clarity and automated daily guidance without touching a single piece of complex technology.”

---

## 💭 The Problem

For many NRI professionals living in the US or Europe, managing the medical workflows of aging parents presents major obstacles:
- **Cognitive Friction:** Elderly parents are frequently overwhelmed by dense clinical terminology and reference ranges, leading to unnecessary health anxiety.
- **Linguistic Bottlenecks:** Standard Western AI models translate text into stiff, robotic, formal dictionary translations. They completely fail at handling conversational "code-mixing" (Hinglish/Telugish) that parents actually use and understand.
- **Voice Ephemerality:** Standard automated call systems are fleeting. Once the call ends, the parent cannot re-listen to critical diagnostic thresholds, creating text-retention anxiety.
- **High-Latency AI Overheads:** Multi-modal image analysis, native translation, and voice synthesis take significant time. Handling this synchronously causes carrier server timeouts and broken communication webhooks.

Dear Comrade addresses these core issues using a resilient, event-driven orchestration layer.

---

## 🧠 Core System Processing Lifecycle

The architecture completely decouples volatile external carrier webhooks from internal processing states to protect system throughput.

```txt
[Parent Mobile Device / WhatsApp Image Upload]
                      │
                      ▼
          [Infobip Omnichannel Edge]
                      │
                      ▼ (Fast Ingestion HTTP ACK 200)
       [NestJS Enterprise API Gateway]
                      │
                      ▼ (Microservice Task Enqueue)
            [BullMQ + Redis Queue]
                      │
         ┌────────────┴────────────┐
         ▼ (Async Worker Process)  ▼
 [Gemini 2.5 Flash Vision]   [Pre-Flight Blur/Validation Engine]
 (Extracts Structured JSON)                │ (If Unreadable)
         │                                 ▼
         │                      [Immediate Error Dispatch]
         ▼
 [Supabase/PostgreSQL DB]
   (Time-Series Storage)
         │
         ├─────────────────────────────────────────┐
         ▼ (Postgres Realtime Sync)                ▼ (State Router Engine)
  [Next.js 15 UI Dashboard]               [Dynamic Language Router]
 (Instantly Renders Recharts)             (Detects Dialect Preference)
                                                   │
                                      ┌────────────┴────────────┐
                                      ▼                         ▼
                             [Telugu Pipeline]          [Hindi Pipeline]
                             • Sarvam Mayura Translate  • Sarvam Mayura Translate
                             • Bulbul V3 TTS Stream     • Bulbul V3 TTS Stream
                                      │                         │
                                      └────────────┬────────────┘
                                                   ▼
                                    [Concurrent Split-Target Dispatch Engine]
                                                   │
         ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
         ▼ (Immediate / One-Time)                  ▼ (Immediate / One-Time)                  ▼ (Daily Recurring @ 8 AM IST)
  [To NRI Child via WhatsApp]               [To Parent Call & WhatsApp]               [To Parent Only via Cron Worker]
  • English Clinical Summary text.         • Native Interactive IVR Call.            • Custom Daily Audio Habit Reminder.
  • Suppressed from daily routines.        • Permanent Backup Audio Note.            • Respects Call vs. WhatsApp pref.

```

---

## 🛠️ The Cutting-Edge Tech Stack & Engineering Rationale

| Architecture Layer | Technology | Engineering Selection Reason |
| --- | --- | --- |
| **Monorepo Orchestrator** | **Turborepo** | Enables a unified TypeScript workspace, allowing the Next.js frontend and NestJS backend to share type definitions and Zod validation contracts flawlessly. |
| **Frontend Platform** | **Next.js 15 (App Router)** | Renders the NRI tracking engine using Server Actions, optimized metadata handling, and modern client caching layouts. |
| **Enterprise Backend** | **NestJS 10+** | Implements clean, maintainable, dependency-injected microservice logic, completely isolating external integrations. |
| **Async Task Manager** | **BullMQ + Redis** | Prevents HTTP thread blocking. Heavy computational blocks (Vision OCR, Translation, Voice Streaming) are offloaded to resilient background background jobs. |
| **Messaging Infrastructure** | **Infobip Omnichannel API** | Selected over traditional custom CPaaS for enterprise Indian carrier routing stability, native Outbound Call/IVR scripting, and multi-channel media delivery. |
| **Sovereign Speech AI** | **Sarvam AI (Mayura & Bulbul V3)** | The industry standard for Indian languages. Operates natively with `te-IN` and `hi-IN` code-mixing. Bulbul V3 provides sub-250ms streaming latency over WebSockets. |
| **Inference Framework** | **Gemini 2.5 Flash / Pro** | Utilizes native `responseSchema` configuration to enforce strict, deterministic object generation directly at the model border. |
| **Database & Security** | **Supabase (PostgreSQL)** | Combines relational time-series charting data capabilities with **Row-Level Security (RLS)** for enterprise-grade healthcare compliance. |

---

## 📋 Telephony & State Machine Logic

| Workflow State | Trigger Vector | Core Action Routine | Output Result |
| --- | --- | --- | --- |
| **`MEDIA_INGESTED`** | Infobip Incoming Webhook | Capture file pointer stream, acknowledge webhook, register task payload. | `jobId`, HTTP 200 |
| **`IMAGE_VALIDATED`** | Worker Queue Ingestion | Parse picture resolution, alignment, and legibility thresholds. Fail fast if unreadable. | `isLegible: boolean` |
| **`METRIC_EXTRACTED`** | Gemini Schema Processing | Extract patient context, biomarkers, strict value arrays, and ranges. | `StructuredReportJSON` |
| **`LEDGER_PERSISTED`** | DB Commit Phase | Insert clean records to time-series ledger; trigger broad state changes to Next.js clients. | PostgreSQL Sync Event |
| **`PREFERENCE_CAPTURED`** | Infobip IVR Keypad Press | Listen for DTMF keypad input ("Press 1 or 2") during immediate call event. | `chosenDailyChannel` Update |
| **`SCRIPT_LOCALIZED`** | Sarvam Mayura Invocations | Translate Clinical Summary into warm, empathetic, conversational vernacular syntax. | Code-Mixed Script |
| **`AUDIO_STREAMED`** | Sarvam Bulbul V3 Connection | Open WebSocket channel to stream compressed audio packets directly back to the edge. | `.mp3` Media Object |
| **`PIPELINE_RESOLVED`** | Complete Dispatch Success | Transmit regional voice note + call branch to Parent and English Summary to Child. | Infobip Message SID |
| **`CRON_RECURRING_Fired`** | BullMQ Daily Scheduler | Batch evaluate user profiles at 08:00 IST; compile and stream customized habit audio. | Single-Parent Task Fork |

---

## 🚀 High-Value Architectural Features

### 🎙️ Code-Mixed Voice Synthesizer

Rather than performing raw dictionary conversions that confuse parents, the system feeds scripts to **Sarvam's Bulbul V3 engine**, which retains medical loan words inside natural Indian prose structures (e.g., *"Mee Serum Creatinine level 1.4 koncham high undi"*), replicating an empathetic local doctor.

### 📞 Dual-Channel Persistence Framework

Combines the high-accessibility profile of a real-time telephone call with the durability of standard text apps. By executing an outbound phone hook and appending an `.mp3` file link as a Meta Media Utility Template header, the parent can replay their complete analysis long after the phone call hangs up.

### ⏰ BullMQ Multi-Queue Separation

To respect data noise limits, the architecture separates ingestion hooks from the automated habit tracks. The child's profile parameters are completely isolated from the `daily-cron-reminder-queue`, preventing programmatic leak or daily notification overhead onto the child's communication line.

### 🛡️ Pre-Flight Verification Failover

If the ingested image fails clarity, focus, or contrast requirements, the application aborts the computation loop immediately, firing a compassionate automated message back to the parent request thread (*"Photo koncham mabuluga undi andi..."*), conserving downstream API resource costs.

```
***

Now that the documentation reflects the complete architectural blueprint, we are fully locked and loaded to code. 

Should we spin up the core **NestJS Server Workspace** and map the incoming Infobip webhooks, or configure the **BullMQ + Redis Connection** to orchestrate our task routing?

```