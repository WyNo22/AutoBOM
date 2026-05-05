"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateAvatar } from "./actions";

type Props = {
  currentImage: string | null;
  name: string;
};

const COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export function AvatarUpload({ currentImage, name }: Props) {
  const [image, setImage] = React.useState(currentImage);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bomLineId", "__avatar__");
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        setImage(url);
        await updateAvatar(url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayName = name || "?";
  const color = colorFor(displayName);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group size-20 rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Changer la photo de profil"
      >
        {image ? (
          <img src={image} alt={displayName} className="size-full object-cover" />
        ) : (
          <div className={cn("size-full flex items-center justify-center text-2xl font-bold text-white uppercase", color)}>
            {initials(displayName)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="size-6 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-xs">Upload…</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
      <div>
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-muted-foreground">Clique sur la photo pour la changer</p>
      </div>
    </div>
  );
}
