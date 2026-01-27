# Deployment Notes – 27 ianuarie 2025

## Build & deploy

- **Data:** 2025-01-27  
- **Branch:** `main`  
- **Pre-deploy:** rulează `npm run apply-migration` (sau `prebuild`) pe mediul țintă pentru schema DB.

---

## Funcționalități noi / modificări

### 1. Support Console – Support Threads & Conversație

- **Carduri (Inbox):** Fiecare card are exact **3 chip-uri**: Status, Priority, Assigned/Unassigned. Sincronizate cu controalele din panoul Conversație. Badge-ul „Chatbot” (sursă) a fost scos de pe carduri.
- **Optimistic updates:** Schimbările de Status, Priority și Assign/Unassign se reflectă imediat în UI; revert la eroare. Status-ul nu mai revine la valoarea veche după confirmarea API.
- **Status:** Opțiunea „Assigned” a fost scoasă din dropdown-ul de status. Adăugat status **Active** (DB, API, UI); se comportă ca celelalte statusuri.
- **Thread Detail eliminat:** Secțiunea Thread Detail a fost desființată. Controalele (Status, Priority, Assign/Unassign, Internal Notes) au fost mutate în **partea de sus a panoului Conversație**.
- **Reply to customer:** Eliminat din Support Console; răspunsurile se trimit prin **chat widget**.
- **Conversație:** Mesajele thread-ului selectat se afișează în panoul Conversație. La schimbarea cardului, mesajele se actualizează. Fără selecție, panoul rămâne gol.

### 2. Chat Widget & Context

- **SupportThreadChatContext** (`lib/support-thread-chat-context.tsx`): Context nou pentru partajarea stării de chat (mesaje thread, thread selectat, loading) între InboxTab și ChatWidget. Provider în root layout.
- **Chat widget pe /support:** Când utilizatorul e pe `/support` și un thread e selectat, widget-ul global (floating) afișează **aceleași mesaje** ca panoul Conversație (sincronizat prin context).
- **Input + Send:** Zona de scriere și butonul de trimitere rămân **mereu vizibile** în chat widget, inclusiv când se afișează mesajele unui thread din Support Threads.

### 3. Baza de date & migrații

- **`support_thread_status`:** Adăugat valorii enum valoarea `'active'` via `ALTER TYPE ... ADD VALUE IF NOT EXISTS 'active'` în `ensureSupportConsoleSchema` (run-migration).
- **`support_moderation_history`:** Tabel nou în `ensureSupportConsoleSchema`:
  - Audit pentru acțiuni de moderare: `thread.statusChange`, `thread.priorityChange`, `thread.assign` / `thread.unassign`, acțiuni pe mesaje (hide/redact/etc.).
  - Coloane: `id`, `actor_id`, `actor_name`, `actor_role`, `action_type`, `entity_type`, `entity_id`, `thread_id`, `reason`, `note`, `metadata`, `created_at`.
  - Indexuri: `thread_idx`, `entity_idx`, `actor_idx`, `action_idx`, `created_idx`, `composite_idx`.

### 4. Alte modificări incluse

- Actualizări API admin (support threads, users, products), chat webhook, middleware, NLU, layout support, set-admin-role, `.env.example` – aliniate la noile flow-uri și schema.

---

## Post-deploy

- [ ] Verifică că **Support Console** (`/support`) funcționează: listă thread-uri, selecție card, conversație, Status/Priority/Assign, internal notes.
- [ ] Verifică **chat widget** pe `/support` cu thread selectat: mesajele thread-ului apar, input/send mereu vizibile.
- [ ] Verifică schimbarea statusului în **Active** și că nu apar erori la scrierea în `support_moderation_history`.
