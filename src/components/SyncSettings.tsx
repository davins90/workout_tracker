"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ExerciseHistoryMap } from "@/lib/workout-data";
import { Cloud, Download, Upload, RefreshCw, CheckCircle2, ShieldCheck, Database } from "lucide-react";

interface SyncSettingsProps {
  history: ExerciseHistoryMap;
  onImport: (newHistory: ExerciseHistoryMap) => void;
  onCloudSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncSource: string;
}

export function SyncSettings({
  history,
  onImport,
  onCloudSync,
  isSyncing,
  lastSyncSource,
}: SyncSettingsProps) {
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
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          onImport(parsed);
          toast({
            title: "Dati importati con successo!",
            description: "La cronologia dei tuoi allenamenti è stata aggiornata.",
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
            <Badge variant="outline" className="flex items-center gap-1.5 text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Google Cloud Storage
            </Badge>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Tutti i carichi vengono memorizzati in tempo reale nel bucket Google Cloud e nella memoria locale del dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="p-3.5 rounded-lg bg-muted/60 border text-xs sm:text-sm space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Origine dati:
              </span>
              <span className="font-semibold">{lastSyncSource === "cloud" ? "Cloud Storage (GCP)" : "Cache Locale (Offline)"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Voci totali registrate:
              </span>
              <span className="font-semibold">{totalRecords} serie salvate</span>
            </div>
          </div>

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
