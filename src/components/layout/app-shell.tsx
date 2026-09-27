"use client";

import { useSyncExternalStore } from "react";
import { Sidebar } from "./sidebar";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function collapsedSnapshot() {
  return localStorage.getItem("sidebar-collapsed") === "true";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, collapsedSnapshot, () => false);

  function toggle() {
    localStorage.setItem("sidebar-collapsed", String(!collapsed));
    listeners.forEach((listener) => listener());
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
