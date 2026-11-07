import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Eye,
  Palette,
  Save,
  Loader2,
  Undo2,
  Plus,
  Upload,
  X,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { themes, applyTheme, applyCustomThemeColors, getThemeById, type Theme, type ThemeColors } from "@/lib/themes";
import { useCustomThemes } from "@/hooks/useCustomThemes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import heroMain from "@/assets/hero-main.jpg";
import heroMidnightSilver from "@/assets/hero-midnight-silver.jpg";
import heroIvoryNoir from "@/assets/hero-ivory-noir.jpg";
import heroDeepBurgundy from "@/assets/hero-deep-burgundy.jpg";
import heroForestEmerald from "@/assets/hero-forest-emerald.jpg";
import heroArcticWhite from "@/assets/hero-arctic-white.jpg";

const themeHeroImages: Record<string, string> = {
  studio: heroMain,
  "dark-gold": heroMain,
  "midnight-silver": heroMidnightSilver,
  "ivory-noir": heroIvoryNoir,
  "deep-burgundy": heroDeepBurgundy,
  "forest-emerald": heroForestEmerald,
  "arctic-white": heroArcticWhite,
};

const colorGroups = [
  { label: "Foundation", keys: ["background", "foreground", "card", "card-foreground"] },
  { label: "Brand", keys: ["primary", "primary-foreground", "accent", "accent-foreground", "gold", "champagne"] },
  { label: "UI", keys: ["secondary", "secondary-foreground", "muted", "muted-foreground", "border", "input"] },
  { label: "Feedback", keys: ["destructive", "destructive-foreground", "ring"] },
];

function hslToHex(hslStr: string): string {
  const parts = hslStr.trim().split(/\s+/);
  const h = parseFloat(parts[0]) || 0;
  const s = (parseFloat(parts[1]) || 0) / 100;
  const l = (parseFloat(parts[2]) || 0) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const AdminThemes = () => {
  const { toast } = useToast();
  const { settings, updateSettings, isUpdating } = useStoreSettings();
  const { customThemes, createTheme, deleteTheme } = useCustomThemes();
  const [selectedTheme, setSelectedTheme] = useState(settings.theme || "studio");
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const savedTheme = settings.theme || "studio";

  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customColors, setCustomColors] = useState<ThemeColors>({ ...themes[0].colors });
  const [customName, setCustomName] = useState("");
  const [customHeroPreview, setCustomHeroPreview] = useState<string | null>(null);
  const [customHeroFile, setCustomHeroFile] = useState<File | null>(null);
  const [customHero, setCustomHero] = useState({
    headline: "Redefining",
    highlightWord: "Elegance",
    subtitle: "Discover curated collections from the world's most prestigious fashion houses.",
    tagline: "Timeless Elegance Since 2025",
  });
  const heroInputRef = useRef<HTMLInputElement>(null);
  const builderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedTheme(settings.theme || "studio");
  }, [settings.theme]);

  const isPresetTheme = (id: string) => themes.some(t => t.id === id);

  const handlePreview = (themeId: string) => {
    setPreviewTheme(themeId);
    setSelectedTheme(themeId);
    if (isPresetTheme(themeId)) {
      applyTheme(themeId);
    } else {
      const ct = customThemes.find(t => t.id === themeId);
      if (ct) applyCustomThemeColors(ct.colors);
    }
  };

  const handleRevert = () => {
    setPreviewTheme(null);
    setSelectedTheme(savedTheme);
    if (isPresetTheme(savedTheme)) {
      applyTheme(savedTheme);
    } else {
      const ct = customThemes.find(t => t.id === savedTheme);
      if (ct) applyCustomThemeColors(ct.colors);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings({ theme: selectedTheme });
      setPreviewTheme(null);
      const name = isPresetTheme(selectedTheme)
        ? getThemeById(selectedTheme).name
        : customThemes.find(t => t.id === selectedTheme)?.name || "Custom";
      toast({ title: "Theme saved", description: `"${name}" is now active.` });
    } catch {
      toast({ title: "Failed to save theme", variant: "destructive" });
    }
  };

  const handleCustomColorChange = (key: string, hex: string) => {
    setCustomColors((prev) => ({ ...prev, [key]: hexToHsl(hex) }));
  };

  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomHeroFile(file);
      setCustomHeroPreview(URL.createObjectURL(file));
    }
  };

  const openCustomBuilder = () => {
    const base = getThemeById(selectedTheme);
    setCustomColors({ ...base.colors });
    setCustomName("");
    setCustomHeroPreview(themeHeroImages[selectedTheme] || heroMain);
    setCustomHeroFile(null);
    setCustomHero({ ...base.hero });
    setShowCustomBuilder(true);
    setTimeout(() => builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleSaveCustomTheme = async () => {
    if (!customName.trim()) {
      toast({ title: "Please enter a theme name", variant: "destructive" });
      return;
    }
    try {
      const result = await createTheme.mutateAsync({
        name: customName.trim(),
        colors: customColors,
        hero: customHero,
        heroFile: customHeroFile,
      });
      setShowCustomBuilder(false);
      // Auto-select the new custom theme
      handlePreview(result.id);
      toast({ title: "Custom theme created", description: `"${customName}" has been saved.` });
    } catch {
      toast({ title: "Failed to save custom theme", variant: "destructive" });
    }
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    try {
      if (selectedTheme === id) {
        handlePreview("studio");
      }
      if (savedTheme === id) {
        await updateSettings({ theme: "studio" });
      }
      await deleteTheme.mutateAsync(id);
      toast({ title: "Theme deleted", description: `"${name}" has been removed.` });
    } catch {
      toast({ title: "Failed to delete theme", variant: "destructive" });
    }
  };

  const activeThemeName = isPresetTheme(selectedTheme)
    ? getThemeById(selectedTheme).name
    : customThemes.find(t => t.id === selectedTheme)?.name || "Custom";

  const activeColors = isPresetTheme(selectedTheme)
    ? getThemeById(selectedTheme).colors
    : customThemes.find(t => t.id === selectedTheme)?.colors || themes[0].colors;

  const activeHero = isPresetTheme(selectedTheme)
    ? getThemeById(selectedTheme).hero
    : (() => {
        const ct = customThemes.find(t => t.id === selectedTheme);
        return ct ? {
          headline: ct.hero?.headline || "Redefining",
          highlightWord: ct.hero?.highlightWord || "Elegance",
          subtitle: ct.hero?.subtitle || "",
          tagline: ct.hero?.tagline || "",
        } : themes[0].hero;
      })();

  const activeHeroImg = isPresetTheme(selectedTheme)
    ? themeHeroImages[selectedTheme] || heroMain
    : customThemes.find(t => t.id === selectedTheme)?.hero_image_url || heroMain;

  const hasUnsavedChanges = previewTheme !== null && previewTheme !== savedTheme;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
            <Palette className="w-7 h-7 text-primary" />
            Theme Studio
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Customize your storefront's look and feel
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={handleRevert}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-body border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Revert
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isUpdating || !hasUnsavedChanges}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-body bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isUpdating ? "Saving..." : "Save Theme"}
          </button>
        </div>
      </div>

      {/* Unsaved banner */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-accent/10 border border-accent/30 px-4 py-2.5 flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4 text-accent shrink-0" />
            <span className="text-foreground font-body">
              Previewing <span className="font-medium text-accent">{activeThemeName}</span> — save to apply.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Custom CTA */}
      <button
        onClick={openCustomBuilder}
        className="w-full group relative overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors py-5 flex items-center justify-center gap-3"
      >
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        <Plus className="w-5 h-5 text-primary relative" />
        <span className="text-sm font-body font-medium text-primary relative ">
          Create Custom Theme
        </span>
        <ArrowRight className="w-4 h-4 text-primary/60 group-hover:translate-x-1 transition-transform relative" />
      </button>

      {/* Theme Grid — Presets + Custom */}
      <section>
        <h2 className="font-display text-lg text-foreground mb-4">Themes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Preset themes */}
          {themes.map((theme) => {
            const isActive = selectedTheme === theme.id;
            const isSaved = savedTheme === theme.id;
            const heroImg = themeHeroImages[theme.id] || heroMain;

            return (
              <motion.button
                key={theme.id}
                onClick={() => handlePreview(theme.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative text-left overflow-hidden border transition-colors group ${
                  isActive ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img src={heroImg} alt={theme.name} className="w-full h-full object-cover object-[center_25%] transition-transform duration-500 " />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {isSaved && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground font-medium">Active</span>
                  )}
                  {isActive && !isSaved && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-accent text-accent-foreground font-medium">Preview</span>
                  )}
                  {isActive && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-medium text-white">{theme.name}</p>
                    <p className="text-xs text-white/60">{theme.description}</p>
                  </div>
                </div>
                <div className="flex h-1.5">
                  {[theme.colors.background, theme.colors.primary, theme.colors.accent, theme.colors.gold, theme.colors.foreground].map((color, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${color})` }} />
                  ))}
                </div>
              </motion.button>
            );
          })}

          {/* Custom themes */}
          {customThemes.map((ct) => {
            const isActive = selectedTheme === ct.id;
            const isSaved = savedTheme === ct.id;

            return (
              <motion.div
                key={ct.id}
                whileHover={{ y: -2 }}
                className={`relative text-left overflow-hidden border transition-colors group ${
                  isActive ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <button onClick={() => handlePreview(ct.id)} className="w-full text-left">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <div className="w-full h-full" style={{ backgroundColor: `hsl(${ct.colors.background})` }}>
                      {ct.hero_image_url && (
                        <img src={ct.hero_image_url} alt={ct.name} className="w-full h-full object-cover object-[center_25%] transition-transform duration-500 " />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {isSaved && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground font-medium">Active</span>
                    )}
                    {isActive && !isSaved && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-accent text-accent-foreground font-medium">Preview</span>
                    )}
                    {isActive && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white">{ct.name}</p>
                      <p className="text-xs text-white/60">Custom Theme</p>
                    </div>
                  </div>
                  <div className="flex h-1.5">
                    {[ct.colors.background, ct.colors.primary, ct.colors.accent, ct.colors.gold, ct.colors.foreground].map((color, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${color})` }} />
                    ))}
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCustom(ct.id, ct.name); }}
                  className="absolute bottom-3 right-2 p-1.5 bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Delete custom theme"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Live Preview (compact) */}
      <section className="border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-card">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-body font-medium text-foreground">
            Preview — {activeThemeName}
          </span>
        </div>
        <div style={{ backgroundColor: `hsl(${activeColors.background})` }}>
          {/* Mini Nav */}
          <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: `1px solid hsl(${activeColors.border})` }}>
            <span className="font-display text-base " style={{ color: `hsl(${activeColors.foreground})` }}>
              {settings.store_name}
            </span>
            <div className="flex gap-4">
              {["Shop", "Women", "Men", "Sale"].map((item) => (
                <span key={item} className="text-xs font-body " style={{ color: `hsl(${activeColors.foreground} / 0.6)` }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Mini Hero — always white text */}
          <div className="relative aspect-[3/1] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedTheme}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                src={activeHeroImg}
                alt="Hero"
                className="w-full h-full object-cover object-[center_25%]"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 text-center">
              <p className="text-xs font-body mb-1 text-white/90">
                {activeHero.tagline}
              </p>
              <h2 className="font-display text-2xl text-white">
                {activeHero.headline}{" "}
                <span>{activeHero.highlightWord}</span>
              </h2>
            </div>
          </div>

          {/* Buttons preview */}
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {[
              { label: "Add to Cart", bg: activeColors.primary, fg: activeColors["primary-foreground"] },
              { label: "Secondary", bg: activeColors.secondary, fg: activeColors["secondary-foreground"] },
              { label: "Remove", bg: activeColors.destructive, fg: activeColors["destructive-foreground"] },
            ].map((btn) => (
              <div key={btn.label} className="px-4 py-1.5 text-xs font-body " style={{ backgroundColor: `hsl(${btn.bg})`, color: `hsl(${btn.fg})` }}>
                {btn.label}
              </div>
            ))}
            <div className="px-4 py-1.5 text-xs font-body border" style={{ borderColor: `hsl(${activeColors.primary})`, color: `hsl(${activeColors.primary})` }}>
              Outline
            </div>
          </div>
        </div>
      </section>

      {/* Custom Theme Builder */}
      <div ref={builderRef}>
        <AnimatePresence>
          {showCustomBuilder && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-card border border-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <h2 className="font-display text-lg text-foreground flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      Create Custom Theme
                    </h2>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      Pick colors, upload a hero image, and save your custom theme.
                    </p>
                  </div>
                  <button onClick={() => setShowCustomBuilder(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-6">
                  {/* Name + Hero */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Theme Name *</Label>
                      <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="My Custom Theme" className="bg-secondary" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Hero Image</Label>
                      <div className="flex items-center gap-3">
                        <div className="relative w-32 aspect-[16/9] bg-muted overflow-hidden border border-border shrink-0">
                          {customHeroPreview ? (
                            <img src={customHeroPreview} alt="Hero" className="w-full h-full object-cover object-[center_25%]" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Upload className="w-5 h-5" /></div>
                          )}
                        </div>
                        <div>
                          <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroFileChange} className="hidden" />
                          <button onClick={() => heroInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-body border border-border text-muted-foreground hover:text-foreground transition-colors">
                            <Upload className="w-3 h-3" /> Upload
                          </button>
                          <p className="text-xs text-muted-foreground mt-1">1920×810 recommended</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero text fields */}
                  <div>
                    <p className="text-xs font-body text-muted-foreground mb-2">Hero Content</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Tagline</Label>
                        <Input value={customHero.tagline} onChange={(e) => setCustomHero(p => ({ ...p, tagline: e.target.value }))} className="bg-secondary text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Headline</Label>
                        <Input value={customHero.headline} onChange={(e) => setCustomHero(p => ({ ...p, headline: e.target.value }))} className="bg-secondary text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Highlight Word</Label>
                        <Input value={customHero.highlightWord} onChange={(e) => setCustomHero(p => ({ ...p, highlightWord: e.target.value }))} className="bg-secondary text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Subtitle</Label>
                        <Input value={customHero.subtitle} onChange={(e) => setCustomHero(p => ({ ...p, subtitle: e.target.value }))} className="bg-secondary text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Color pickers */}
                  {colorGroups.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-body text-muted-foreground mb-2">{group.label}</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {group.keys.map((key) => {
                          const hsl = customColors[key as keyof ThemeColors];
                          if (!hsl) return null;
                          const hex = hslToHex(hsl);
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <input type="color" value={hex} onChange={(e) => handleCustomColorChange(key, e.target.value)} className="w-7 h-7 border border-border cursor-pointer bg-transparent shrink-0" />
                                <span className="text-[8px] font-mono text-muted-foreground truncate">{hex}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{key}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Inline preview */}
                  <div>
                    <p className="text-xs font-body text-muted-foreground mb-2">Preview</p>
                    <div className="border border-border/40 p-3" style={{ backgroundColor: `hsl(${customColors.background})` }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-display text-sm " style={{ color: `hsl(${customColors.foreground})` }}>{settings.store_name}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i}>
                            <div className="aspect-[3/4] mb-1" style={{ backgroundColor: `hsl(${customColors.muted})` }} />
                            <div className="h-1 w-3/4 mb-0.5" style={{ backgroundColor: `hsl(${customColors.foreground} / 0.5)` }} />
                            <div className="h-1 w-1/2" style={{ backgroundColor: `hsl(${customColors.primary})` }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <div className="px-3 py-1 text-[8px] " style={{ backgroundColor: `hsl(${customColors.primary})`, color: `hsl(${customColors["primary-foreground"]})` }}>Primary</div>
                        <div className="px-3 py-1 text-[8px] border" style={{ borderColor: `hsl(${customColors.primary})`, color: `hsl(${customColors.primary})` }}>Outline</div>
                        <div className="px-3 py-1 text-[8px] " style={{ backgroundColor: `hsl(${customColors.accent})`, color: `hsl(${customColors["accent-foreground"]})` }}>Accent</div>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground font-body">
                      Save to add this theme to your collection.
                    </p>
                    <button
                      onClick={handleSaveCustomTheme}
                      disabled={createTheme.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-body bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {createTheme.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {createTheme.isPending ? "Saving..." : "Save Custom Theme"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminThemes;
