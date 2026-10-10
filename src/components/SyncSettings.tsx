"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ExerciseHistoryMap } from "@/lib/workout-data";
import { sanitizeHistory } from "@/lib/history";
import { Cloud, Download, Upload, RefreshCw, ShieldCheck, Database, KeyRound } from "lucide-react";

interface SyncSettingsProps {
  history: ExerciseHistoryMap;
  onImport: (newHistory: ExerciseHistoryMap) => void;
  onCloudSync: () => Promise<void>;
  syncStatus: "loading" | "syncing" | "synced" | "pending" | "locked";
  accessCode: string;
  onSaveAccessCode: (code: string) => Promise<void>;
}

const STATUS_LABELS: Record<SyncSettingsProps["syncStatus"], string> = {
  loading: "Caricamento...",
  syncing: "Sincronizzazione in corso...",
  synced: "Sincronizzato con il cloud",
  pending: "Solo su questo dispositivo (da sincronizzare)",
  locked: "Codice di accesso richiesto",
};

export function SyncSettings({
  history,
  onImport,
  onCloudSync,
  syncStatus,
  accessCode,
  onSaveAccessCode,
}: SyncSettingsProps) {
  const isSyncing = syncStatus === "syncing" || syncStatus === "loading";
  const [codeInput, setCodeInput] = useState(accessCode);
  useEffect(() => setCodeInput(accessCode), [accessCode]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `workout_tracker_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast({
        title: "Backup esportato!",
        description: "Il file JSON con tutti i tuoi carichi è stato scaricato.",
      });
    } catch (err) {
      toast({
        title: "Errore durante l'esportazione",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = sanitizeHistory(JSON.parse(event.target?.result as string));
        if (parsed) {
          onImport(parsed);
          toast({
            title: "Dati importati con successo!",
            description: "Le sessioni del backup sono state aggiunte alla cronologia.",
          });
        } else {
          throw new Error("Formato file non valido");
        }
      } catch (err) {
        toast({
          title: "Errore durante l'importazione",
          description: "Assicurati di selezionare un file JSON di backup valido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalRecords = Object.values(history).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Cloud Status Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Salvataggio & Cloud Storage</CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            I dati vengono salvati subito su questo dispositivo e sincronizzati con il cloud appena c'è connessione.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="p-3.5 rounded-lg bg-muted/60 border text-xs sm:text-sm space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Stato:
              </span>
              <span className="font-semibold text-right">{STATUS_LABELS[syncStatus]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sessioni registrate:
              </span>
              <span className="font-semibold">{totalRecords}</span>
            </div>
          </div>

          {/* Only needed without Google login in front of the app */}
          {(syncStatus === "locked" || accessCode) && (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void onSaveAccessCode(codeInput.trim());
              }}
            >
              <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Codice di accesso"
                aria-label="Codice di accesso"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="h-10"
              />
              <Button type="submit" variant="outline" disabled={isSyncing || !codeInput.trim()} className="h-10">
                Salva
              </Button>
            </form>
          )}

          <Button
            onClick={onCloudSync}
            disabled={isSyncing}
            className="w-full bg-primary text-primary-foreground flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Sincronizzazione in corso..." : "Forza Sincronizzazione con il Cloud"}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Manual Backup Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Backup Manuale (File JSON)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Esporta o ripristina la cronologia completa dei tuoi pesi su qualsiasi dispositivo in totale sicurezza.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center justify-center gap-2 h-11 border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <Download className="h-4 w-4" />
            <span>Esporta Backup JSON</span>
          </Button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-11"
            >
              <Upload className="h-4 w-4" />
              <span>Importa Backup JSON</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
