export interface Exercise {
  id: string;
  nome: string;
  gruppo: string;
  serie: number;
  repsTarget: string; // e.g. "6–10", "8–12"
  recupero: number; // in seconds
  opzionale?: boolean;
  varianti?: string[]; // If alternative exercises can be chosen
  superserie?: string; // Name of the exercise this one is paired with (rest only after the pair)
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
  serie: (number | null)[]; // kg per set
  reps?: (number | null)[]; // repetitions per set
  ts?: number; // last edit time (ms), used to resolve sync conflicts
}

// Exercise history format: exerciseName -> WeightHistoryEntry[]
// Storing an array of entries per exercise enables PROGRESS CHARTS over time!
export type ExerciseHistoryMap = Record<string, WeightHistoryEntry[]>;

export const WORKOUT_DAYS: WorkoutDay[] = [
  {
    id: "scheda-a",
    titolo: "A — Upper + Leg press",
    tipo: "base",
    durataStimata: "≈50 min",
    esercizi: [
      {
        id: "panca_inclinata_multi",
        nome: "Panca inclinata multipower",
        gruppo: "Petto",
        serie: 4,
        repsTarget: "6–10",
        recupero: 105,
      },
      {
        id: "chest_press_a",
        nome: "Chest press",
        gruppo: "Petto",
        serie: 2,
        repsTarget: "8–12",
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
        id: "leg_press",
        nome: "Leg press",
        gruppo: "Gambe",
        serie: 3,
        repsTarget: "8–12",
        recupero: 0,
        superserie: "Calf press",
      },
      {
        id: "calf_press",
        nome: "Calf press",
        gruppo: "Polpacci",
        serie: 3,
        repsTarget: "10–15",
        recupero: 90,
        superserie: "Leg press",
      },
      {
        id: "alzate_laterali_a",
        nome: "Alzate laterali",
        gruppo: "Spalle",
        serie: 4,
        repsTarget: "12–20",
        recupero: 0,
        superserie: "Curl inclinato / manubri",
      },
      {
        id: "curl_inclinato",
        nome: "Curl inclinato / manubri",
        gruppo: "Bicipiti",
        serie: 4,
        repsTarget: "8–12",
        recupero: 60,
        superserie: "Alzate laterali",
      },
      {
        id: "reverse_fly_or_facepull",
        nome: "Face pull al cavo",
        varianti: ["Face pull al cavo", "Reverse fly alla pec deck"],
        gruppo: "Deltoidi Post",
        serie: 2,
        repsTarget: "12–20",
        recupero: 0,
        superserie: "Pushdown tricipiti",
      },
      {
        id: "pushdown_tricipiti_a",
        nome: "Pushdown tricipiti",
        gruppo: "Tricipiti",
        serie: 4,
        repsTarget: "10–15",
        recupero: 60,
        superserie: "Face pull al cavo",
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
    titolo: "B — Upper + Stacco rumeno",
    tipo: "base",
    durataStimata: "≈50 min",
    esercizi: [
      {
        id: "chest_press_b",
        nome: "Chest press",
        gruppo: "Petto",
        serie: 4,
        repsTarget: "8–12",
        recupero: 105,
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
        id: "romanian_deadlift",
        nome: "Romanian deadlift",
        gruppo: "Femorali/Glutei",
        serie: 3,
        repsTarget: "6–10",
        recupero: 120,
      },
      {
        id: "alzate_laterali_b",
        nome: "Alzate laterali",
        gruppo: "Spalle",
        serie: 4,
        repsTarget: "12–20",
        recupero: 0,
        superserie: "Hammer curl",
      },
      {
        id: "hammer_curl",
        nome: "Hammer curl",
        gruppo: "Bicipiti/Brachiale",
        serie: 4,
        repsTarget: "8–12",
        recupero: 60,
        superserie: "Alzate laterali",
      },
      {
        id: "reverse_curl_b",
        nome: "Reverse curl",
        gruppo: "Avambracci/Brachioradiale",
        serie: 3,
        repsTarget: "10–15",
        recupero: 0,
        superserie: "Estensioni tricipiti sopra testa",
      },
      {
        id: "estensioni_tricipiti_overhead",
        nome: "Estensioni tricipiti sopra testa",
        gruppo: "Tricipiti",
        serie: 4,
        repsTarget: "10–15",
        recupero: 60,
        superserie: "Reverse curl",
      },
    ],
  },
];
