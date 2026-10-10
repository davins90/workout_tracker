# Progress Tracking: Workout Tracker (workout-tracker-uexmt)

## 📌 Panoramica del Progetto
Applicazione web moderna per il tracciamento degli allenamenti, progressioni di carico e routine fitness (Scheda A, Scheda B, Grafici, Backup).

---

## 🚀 Stato Attuale (aggiornato al 10/10/2026)
- [x] **Programma**: due schede full-body con focus sulla parte alta (A e B, circa 50 minuti, 2 sedute a settimana), con superserie solo tra attrezzi vicini. Definite in `src/lib/workout-data.ts`.
- [x] **Stack Tecnologico**:
  - **Frontend/Backend:** Next.js 14.2.35 (App Router, `src/app/page.tsx`, `src/app/api/workout/route.ts`).
  - **UI/Styling:** Tailwind CSS, Radix UI (`src/components/ui/`), Lucide React.
  - **Componenti Chiave:** `WorkoutExerciseCard.tsx`, `FloatingRestTimer.tsx`, `ProgressCharts.tsx`, `SyncSettings.tsx`.
  - **Logica dati:** `src/lib/history.ts` (validazione e unione dello storico), test in `tests/history.test.mjs`.
- [x] **Funzioni**: kg e ripetizioni per serie, salvataggio automatico, varianti con storico separato, timer di recupero, grafici, backup JSON.
- [x] **Produzione Live**: Cloud Run in `europe-west8`, progetto `workout-tracker-uexmt`: [`https://workout-tracker-746817612779.europe-west8.run.app/`](https://workout-tracker-746817612779.europe-west8.run.app/).
- [x] **Accesso**: Identity-Aware Proxy con login Google; autorizzato solo `daniele.davino12@gmail.com`. Client OAuth personalizzato (file in `~/.keys/workout-tracker-iap-oauth.json`, fuori dal repository). Codice di accesso di riserva nel secret `workout-access-code`.
- [x] **Dati**: bucket `workout-tracker-uexmt-data` (europe-west8, versioning attivo), file `data/workout_history.json`.
- [x] **Deploy**: GitHub Actions a ogni push su `main` (typecheck, test, build, poi deploy), autenticazione con Workload Identity Federation, nessuna chiave salvata.
- [x] **Archivio Prototipo**: il vecchio codice Streamlit è in `old_streamlit_prototype/`.

---

## 📋 Prossimi Passi (To-Do)
- [x] Commit e push del codice Next.js su GitHub.
- [x] CI/CD GitHub Actions con controlli (typecheck, test, build) e deploy su Cloud Run.
- [x] API protetta da codice di accesso, sincronizzazione con unione dei dati, registrazione delle ripetizioni.
- [x] Login con Google tramite IAP (client OAuth personalizzato), accesso pubblico chiuso.
- [ ] Decidere se eliminare il vecchio bucket `ai-studio-bucket-746817612779-us-west1` (dati già migrati; contiene anche un archivio di build di AI Studio di marzo 2026).
- [ ] Aggiornamento a una major di Next.js più recente (la linea 14.x ha avvisi di sicurezza aperti).
- [ ] Pianificare la migrazione del servizio Cloud Run su `dani-lab-507314` (quando vorrai consolidare i progetti).
