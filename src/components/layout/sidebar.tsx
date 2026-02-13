"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { clearAllData } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Library,
  FileQuestion,
  BarChart3,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/library", label: "Library", icon: Library },
  { href: "/tests", label: "Tests", icon: FileQuestion },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const [showClearDialog, setShowClearDialog] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className={cn("flex items-center", collapsed ? "p-4 justify-center" : "p-6 justify-between")}>
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="STARK" className="h-7 w-auto flex-shrink-0" />
          {!collapsed && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="/name.svg" alt="STARK" className="h-3.5 w-auto" />
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="text-muted hover:text-text transition-colors cursor-pointer"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="px-3 mb-2 flex justify-center">
          <button
            onClick={onToggle}
            className="text-muted hover:text-text transition-colors p-2 rounded-[12px] hover:bg-black/[0.03] cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200",
                collapsed ? "px-0 justify-center" : "px-3",
                isActive
                  ? "bg-black/5 text-text"
                  : "text-muted hover:text-text hover:bg-black/[0.03]"
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mx-3 mb-3 space-y-2">
          <div className="p-4 bg-bg rounded-[12px] border border-card-border">
            <p className="text-xs text-muted">All data stored locally</p>
            <p className="text-xs text-muted mt-0.5">in your browser&apos;s IndexedDB</p>
          </div>
          <button
            onClick={() => setShowClearDialog(true)}
            aria-label="Clear all data"
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-error transition-colors w-full rounded-[12px] hover:bg-error/5 cursor-pointer"
          >
            <Trash2 size={14} />
            Clear all data
          </button>
        </div>
      ) : (
        <div className="px-3 mb-3 flex justify-center">
          <button
            onClick={() => setShowClearDialog(true)}
            title="Clear all data"
            aria-label="Clear all data"
            className="text-muted hover:text-error transition-colors p-2 rounded-[12px] hover:bg-error/5 cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      <Dialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        title="Clear All Data"
      >
        <p className="text-sm text-muted">
          This will permanently delete all your projects, PDFs, tests, and settings. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setShowClearDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await clearAllData();
              toast.success("All data cleared");
              setShowClearDialog(false);
            }}
          >
            Clear Everything
          </Button>
        </div>
      </Dialog>
    </aside>
  );
}
