"use client";

import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { FormField, Textarea } from "@/components/ui/FormField";

export function ProviderPhotoUpload({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const t = useTranslations("providerSignup.photos");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(false);

    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of files) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("provider-uploads").upload(path, file);
      if (uploadError) {
        setError(true);
        continue;
      }
      const { data } = supabase.storage.from("provider-uploads").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    onChange([...photos, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(url: string) {
    onChange(photos.filter((p) => p !== url));
  }

  function handlePastedUrls(value: string) {
    const pasted = value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const uploadedSet = new Set(photos);
    const merged = [...photos];
    for (const url of pasted) {
      if (!uploadedSet.has(url)) {
        merged.push(url);
        uploadedSet.add(url);
      }
    }
    onChange(merged);
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label={t("uploadLabel")} htmlFor="provider-photos">
        <input
          id="provider-photos"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={uploading}
          className="block w-full text-sm text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-brand-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-terracotta"
        />
      </FormField>
      {uploading && <p className="text-sm text-foreground/60">{t("uploading")}</p>}
      {error && <p className="text-sm text-red-600">{t("uploadError")}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-brand-cream-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                aria-label={t("removePhoto")}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <FormField label={t("urlFallbackLabel")} htmlFor="provider-photos-urls">
        <Textarea id="provider-photos-urls" onBlur={(e) => handlePastedUrls(e.target.value)} placeholder={t("urlFallbackPlaceholder")} />
      </FormField>
      <p className="text-xs text-foreground/50">{t("noPhotosNote")}</p>
    </div>
  );
}
