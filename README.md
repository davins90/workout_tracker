# Workout Tracker WebApp

Applicazione web moderna sviluppata con Next.js (App Router), React, Tailwind CSS, Radix UI e Lucide Icons, portata da Google AI Studio a Cloud Shell.

## Funzionalità
- **Schede di allenamento suddivise**:
  - `UPPER A — Push Emphasis`
  - `UPPER B — Pull Emphasis`
  - `LOWER A — Quad & Glutei`
  - `LOWER B — Posterior Chain`
- **Fasi guidate**:
  - Riscaldamento specifico con dettagli per ciascuna sessione
  - Esercizi con serie, ripetizioni consigliate e indicazioni Superset
  - Defaticamento e stretching mirato
- **Tracking carichi (kg)**:
  - Input per ogni serie
  - Data dell'ultimo aggiornamento per ciascun esercizio
  - Salvataggio persistente in `localStorage`
  - Notifiche toast di conferma
- **Timer di recupero (Rest Timer)**:
  - Popover con display digitale mm:ss
  - Avvio / Pausa / Reset
  - Segnale acustico alla conclusione del recupero tramite Web Audio API
- **Design responsive**:
  - Ottimizzato per mobile e desktop
  - Palette colori e componenti UI basati sullo standard shadcn/ui

## Avvio in Locale

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

3. Apri l'anteprima web sulla porta 3000 (tramite la funzione "Web Preview" di Cloud Shell).

## Build di produzione
```bash
npm run build
npm start
```
