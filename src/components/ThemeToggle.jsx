import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gvx-theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("gvx-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((prev) => !prev)}
      aria-label="Toggle theme"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-10 w-10 items-center justify-center
      rounded-full border border-black/10 bg-white text-gray-700
      shadow-sm transition-all duration-300 hover:scale-110
      hover:shadow-md dark:border-white/10 dark:bg-white/5
      dark:text-white"
    >
      {dark ? (
        <Sun size={18} className="transition-all duration-300" />
      ) : (
        <Moon size={18} className="transition-all duration-300" />
      )}
    </button>
  );
}