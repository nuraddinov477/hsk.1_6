"use client";

import { ImportTab } from "../ImportTab";

export default function AdminImportPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Ko&apos;p kontent yuklash</h1>
        <p className="mt-1 text-sm text-muted-foreground">TSV (Excel) yoki JSON formatida ommaviy import.</p>
      </header>
      <ImportTab />
    </div>
  );
}
