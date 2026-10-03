export interface Exercise {
  id: string;
  nome: string;
  gruppo: string;
  serie: number;
  repsTarget: string; // e.g. "6–10", "8–12"
  recupero: number; // in seconds
  opzionale?: boolean;
  varianti?: string[]; // If alternative exercises can be chosen
}

export interface WorkoutDay {
  id: string;
  titolo: string;
  tipo: "base" | "bonus";
  durataStimata: string;
  esercizi: Exercise[];
}

export interface WeightHistoryEntry {
  data: string; // "yyyy-MM-dd"
  serie: (number | null)[];
}

// Exercise history format: exerciseName -> WeightHistoryEntry[]
// Storing an array of entries per exercise enables PROGRESS CHARTS over time!
export type ExerciseHistoryMap = Record<string, WeightHistoryEntry[]>;

export const WORKOUT_DAYS: WorkoutDay[] = [
  {
    id: "scheda-a",
    titolo: "A — Chest & Glutes",
    tipo: "base",
    durataStimata: "40–45 min",
    esercizi: [
      {
        id: "panca_inclinata_multi",
        nome: "Panca inclinata multipower",
        gruppo: "Petto",
        serie: 4,
        repsTarget: "6–10",
        recupero: 90,
      },
      {
        id: "lat_machine",
        nome: "Lat machine",
        gruppo: "Dorso",
        serie: 4,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "hip_thrust_a",
        nome: "Hip thrust",
        gruppo: "Glutei",
        serie: 3,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "leg_extension",
        nome: "Leg extension",
        gruppo: "Gambe",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
      {
        id: "alzate_laterali_a",
        nome: "Alzate laterali",
        gruppo: "Spalle",
        serie: 3,
        repsTarget: "12–20",
        recupero: 60,
      },
      {
        id: "curl_inclinato",
        nome: "Curl inclinato / manubri",
        gruppo: "Bicipiti",
        serie: 2,
        repsTarget: "8–12",
        recupero: 60,
      },
      {
        id: "pushdown_tricipiti_a",
        nome: "Pushdown tricipiti",
        gruppo: "Tricipiti",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
      {
        id: "crunch_macchina",
        nome: "Crunch macchina",
        gruppo: "Addome",
        serie: 2,
        repsTarget: "10–15",
        recupero: 45,
        opzionale: true,
      },
    ],
  },
  {
    id: "scheda-b",
    titolo: "B — Back & Arms",
    tipo: "base",
    durataStimata: "40–45 min",
    esercizi: [
      {
        id: "romanian_deadlift",
        nome: "Romanian deadlift",
        gruppo: "Femorali/Glutei",
        serie: 2,
        repsTarget: "6–10",
        recupero: 120,
      },
      {
        id: "chest_press_b",
        nome: "Chest press",
        gruppo: "Petto",
        serie: 4,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "pulley_seated_row",
        nome: "Pulley / seated row",
        gruppo: "Dorso",
        serie: 4,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "leg_curl_seduto",
        nome: "Leg curl seduto",
        gruppo: "Femorali",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
      {
        id: "alzate_laterali_b",
        nome: "Alzate laterali",
        gruppo: "Spalle",
        serie: 3,
        repsTarget: "12–20",
        recupero: 60,
      },
      {
        id: "hammer_curl",
        nome: "Hammer curl",
        gruppo: "Bicipiti/Brachiale",
        serie: 2,
        repsTarget: "8–12",
        recupero: 60,
      },
      {
        id: "estensioni_tricipiti_overhead",
        nome: "Estensioni tricipiti sopra testa",
        gruppo: "Tricipiti",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
      {
        id: "reverse_curl_b",
        nome: "Reverse curl",
        gruppo: "Avambracci/Brachioradiale",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
    ],
  },
  {
    id: "scheda-c",
    titolo: "C — Upper Aesthetics",
    tipo: "bonus",
    durataStimata: "35–40 min",
    esercizi: [
      {
        id: "chest_or_incline",
        nome: "Chest press",
        varianti: ["Chest press", "Panca inclinata"],
        gruppo: "Petto",
        serie: 3,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "lat_machine_neutra",
        nome: "Lat machine presa neutra",
        gruppo: "Dorso",
        serie: 3,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "hip_thrust_c",
        nome: "Hip thrust",
        gruppo: "Glutei",
        serie: 3,
        repsTarget: "8–12",
        recupero: 90,
      },
      {
        id: "alzate_laterali_c",
        nome: "Alzate laterali",
        gruppo: "Spalle",
        serie: 3,
        repsTarget: "12–20",
        recupero: 60,
      },
      {
        id: "reverse_fly_or_facepull",
        nome: "Reverse fly alla pec deck",
        varianti: ["Reverse fly alla pec deck", "Face pull al cavo"],
        gruppo: "Deltoidi Post",
        serie: 2,
        repsTarget: "12–20",
        recupero: 60,
      },
      {
        id: "curl_bicipiti_c",
        nome: "Curl bicipiti",
        gruppo: "Bicipiti",
        serie: 2,
        repsTarget: "8–12",
        recupero: 60,
      },
      {
        id: "pushdown_tricipiti_c",
        nome: "Pushdown tricipiti",
        gruppo: "Tricipiti",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
      {
        id: "reverse_curl_c",
        nome: "Reverse curl",
        gruppo: "Avambracci",
        serie: 2,
        repsTarget: "10–15",
        recupero: 60,
      },
    ],
  },
];
