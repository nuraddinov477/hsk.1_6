"use client";

import { StatsTab } from "../StatsTab";

export default function AdminStatsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Statistika</h1>
        <p className="mt-1 text-sm text-muted-foreground">Faollik, kunlik foydalanuvchilar, eng faol o&apos;quvchilar.</p>
      </header>
      <StatsTab />
    </div>
  );
}
