"use client";

import { FlagsTab } from "../FlagsTab";

export default function AdminFlagsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Funksiya sozlamalari</h1>
        <p className="mt-1 text-sm text-muted-foreground">Modullar va xizmatlarni yoqing/o&apos;chiring.</p>
      </header>
      <FlagsTab />
    </div>
  );
}
