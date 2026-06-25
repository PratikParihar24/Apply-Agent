import React from "react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="btn-ripple relative flex h-9 w-9 items-center justify-center rounded-card border border-cardborder bg-cardbg text-terracotta transition-all hover:bg-cardbg-hover hover:border-terracotta/50 focus-visible:outline-none"
    >
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${
          theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        {/* Sun Icon */}
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <svg
        className={`absolute h-5 w-5 transition-transform duration-500 ${
          theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        {/* Moon Icon */}
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
};
export default ThemeToggle;
