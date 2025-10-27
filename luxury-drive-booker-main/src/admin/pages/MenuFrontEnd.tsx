import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Mesmo storage key da página /menu para compartilhar conteúdo
const STORAGE_KEY = "front-menu-config";

// Tipos e defaults compatíveis com src/pages/Menu.tsx
 type MenuConfig = {
  slideImageUrl: string;
  buttonText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroH3: string;
  container2Title: string;
  container2Subtitle: string;
};

const DEFAULT_CFG: MenuConfig = {
  slideImageUrl: "/placeholder.svg",
  buttonText: "Agendar agora",
  heroTitle: "Mobility de Luxo",
  heroSubtitle: "Transfers executivos com conforto e segurança",
  heroH3: "Experiência Premium em cada trajeto",
  container2Title: "Sofisticação e Eficiência",
  container2Subtitle: "Serviços sob medida para você e sua empresa",
};

export default function MenuFrontEnd() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<MenuConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_CFG, ...(JSON.parse(raw) || {}) } : DEFAULT_CFG;
    } catch {
      return DEFAULT_CFG;
    }
  });

  const canSave = useMemo(() => {
    return (
      cfg.buttonText.trim().length > 0 &&
      cfg.heroTitle.trim().length > 0
    );
  }, [cfg]);

  useEffect(() => {
    // Apenas para informar que está em modo Admin
    document.title = "Admin • Menu Front End";
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    toast({ title: "Menu atualizado", description: "Conteúdo salvo com sucesso." });
  };

  const handleReset = () => {
    setCfg(DEFAULT_CFG);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CFG));
    toast({ title: "Conteúdo restaurado", description: "Valores padrão aplicados." });
  };

  const onUploadSlide = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setCfg((prev) => ({ ...prev, slideImageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-[100vw] px-2 sm:px-4 md:p-6 overflow-x-hidden">
      <h2 className="text-xl font-semibold mb-4">Menu Front End</h2>
      <Card className="w-full">
        <CardContent className="space-y-6">
          <section className="space-y-4 pt-6">
            <h3 className="text-sm font-semibold">Slide principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Imagem do slide (1922x680px)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onUploadSlide(e.target.files?.[0])}
                />
                <div className="mt-3">
                  <div
                    className="relative w-full rounded-lg overflow-hidden border border-neutral-200 bg-neutral-200 aspect-[1922/680]"
                    style={{
                      backgroundImage: `url(${cfg.slideImageUrl || "/placeholder.svg"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Texto do botão (antes do título)</Label>
                <Input
                  value={cfg.buttonText}
                  onChange={(e) => setCfg({ ...cfg, buttonText: e.target.value })}
                  placeholder="Agendar agora"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Hero (título, subtítulo, H3)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={cfg.heroTitle}
                  onChange={(e) => setCfg({ ...cfg, heroTitle: e.target.value })}
                  placeholder="Mobility de Luxo"
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={cfg.heroSubtitle}
                  onChange={(e) => setCfg({ ...cfg, heroSubtitle: e.target.value })}
                  placeholder="Transfers executivos com conforto e segurança"
                />
              </div>
              <div>
                <Label>H3</Label>
                <Input
                  value={cfg.heroH3}
                  onChange={(e) => setCfg({ ...cfg, heroH3: e.target.value })}
                  placeholder="Experiência Premium em cada trajeto"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Container 2</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={cfg.container2Title}
                  onChange={(e) => setCfg({ ...cfg, container2Title: e.target.value })}
                  placeholder="Sofisticação e Eficiência"
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={cfg.container2Subtitle}
                  onChange={(e) => setCfg({ ...cfg, container2Subtitle: e.target.value })}
                  placeholder="Serviços sob medida para você e sua empresa"
                />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={!canSave}>Salvar</Button>
            <Button variant="secondary" onClick={handleReset}>Resetar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}