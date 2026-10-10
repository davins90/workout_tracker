# Workout Tracker WebApp

Applicazione web per tracciare gli allenamenti, sviluppata con Next.js 14 (App Router), React, Tailwind CSS e Radix UI. Gira su Cloud Run (`europe-west8`) e salva lo storico su Cloud Storage.

## Funzionalità
- **Due schede full-body con focus sulla parte alta** (`src/lib/workout-data.ts`):
  - `A — Upper + Leg press`
  - `B — Upper + Stacco rumeno`
- **Superserie**: gli esercizi in coppia sono etichettati e il timer parte dopo il secondo.
- **Tracking di carichi e ripetizioni** per ogni serie, con salvataggio automatico.
- **Varianti** di esercizio con storico separato (es. Face pull / Reverse fly).
- **Timer di recupero** basato sull'orario di fine, con suono, vibrazione e schermo tenuto acceso dove supportato.
- **Grafici** di progressione del carico massimo per esercizio.
- **Sincronizzazione**: i dati restano sul dispositivo (`localStorage`) e vengono uniti a quelli nel cloud, una voce per esercizio per giorno; a parità di giorno vince la modifica più recente.
- **Backup** manuale: esportazione e importazione in JSON.

## API
`GET` e `POST /api/workout` richiedono l'header `Authorization: Bearer <codice>`.

| Variabile | Uso |
| :--- | :--- |
| `APP_ACCESS_CODE` | Codice di accesso. Obbligatorio in produzione (su Cloud Run arriva dal secret `workout-access-code`). |
| `GCS_BUCKET_NAME` | Bucket dello storico. Default: `workout-tracker-uexmt-data`. |

In sviluppo, senza credenziali Google, lo storico viene salvato in `data/workout_history.json`.

## Avvio in locale
```bash
npm install
npm run dev
```

## Controlli
```bash
npm run typecheck
npm test
npm run build
```

## Deploy
Ogni push su `main` esegue i controlli e poi il deploy su Cloud Run (`.github/workflows/deploy.yml`). L'autenticazione verso Google Cloud usa Workload Identity Federation, senza chiavi salvate nei secret di GitHub.
