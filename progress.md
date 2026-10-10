# Progress Tracking: Workout Tracker (workout-tracker-uexmt)

## 📌 Panoramica del Progetto
Applicazione web moderna per il tracciamento degli allenamenti, progressioni di carico e routine fitness (Scheda A, Scheda B, Grafici, Backup).

---

## 🚀 Stato Attuale
- [x] **Codice Sorgente Reale**: Recuperato con successo dall'archivio sorgente Cloud Run (`gs://run-sources-workout-tracker-uexmt-europe-west8/`).
- [x] **Stack Tecnologico**:
  - **Frontend/Backend:** Next.js (App Router, `src/app/page.tsx`, `src/app/api/workout/route.ts`).
  - **UI/Styling:** Tailwind CSS, Radix UI (`src/components/ui/`), Lucide React.
  - **Componenti Chiave:** `WorkoutExerciseCard.tsx`, `FloatingRestTimer.tsx`, `ProgressCharts.tsx`, `SyncSettings.tsx`.
  - **Container:** `Dockerfile` pronto per deploy su Cloud Run.
- [x] **Produzione Live**: Attiva su Cloud Run in `europe-west8` all'indirizzo [`https://workout-tracker-746817612779.europe-west8.run.app/`](https://workout-tracker-746817612779.europe-west8.run.app/).
- [x] **Archivio Prototipo**: Il vecchio codice Streamlit è stato spostato in `old_streamlit_prototype/`.

---

## 📋 Prossimi Passi (To-Do)
- [x] Commit e push del codice Next.js su GitHub.
- [x] CI/CD GitHub Actions con controlli (typecheck, test, build) e deploy su Cloud Run.
- [x] API protetta da codice di accesso, sincronizzazione con unione dei dati, registrazione delle ripetizioni.
- [x] Login con Google tramite IAP (client OAuth personalizzato), accesso pubblico chiuso.
- [ ] Aggiornamento a una major di Next.js più recente (la linea 14.x ha avvisi di sicurezza aperti).
- [ ] Pianificare la migrazione del servizio Cloud Run su `dani-lab-507314` (quando vorrai consolidare i progetti).
