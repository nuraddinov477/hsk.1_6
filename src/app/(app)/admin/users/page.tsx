"use client";

import { UsersTab } from "../UsersTab";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Foydalanuvchilar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hisoblarni boshqarish: rolni o&apos;zgartirish, blokirovka qilish.</p>
      </header>
      <UsersTab />
    </div>
  );
}
