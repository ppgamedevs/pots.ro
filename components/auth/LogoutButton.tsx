"use client";

import { LogOut } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";

export function LogoutButton() {
  const { logout } = useUser();

  return (
    <button 
      onClick={logout}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
    >
      <LogOut className="h-5 w-5" />
      Deconectare
    </button>
  );
}
