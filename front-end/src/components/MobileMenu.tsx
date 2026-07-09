import React from "react";
import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

interface User {
  id: string;
  email: string;
  name: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onRequestLogout: () => void;
  huntActive: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  user,
  onRequestLogout,
  huntActive,
}) => {
  const linkCls =
    "block w-full py-3 px-4 rounded-card text-base font-semibold text-mutedtext hover:text-cream hover:bg-cardbg-hover transition-colors";
  const activeCls = "text-cream bg-cardbg font-bold border-l-4 border-terracotta pl-3";

  return (
    <>
      {/* Blurred Overlay backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-45 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-in Panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-[280px] mobile-menu-aside bg-cardbg border-l border-cardborder p-6 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-cardborder pb-4">
              <span className="text-lg font-extrabold tracking-tight text-terracotta">
                Navigation
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-card border border-cardborder bg-cardbg p-2 text-cream hover:bg-cardbg-hover focus-visible:outline-none"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="space-y-2">
              <Link to="/" onClick={onClose} className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>
                Home
              </Link>
              {user && (
                <>
                  <Link to="/hunt" onClick={onClose} className={`relative ${linkCls}`} activeProps={{ className: activeCls }}>
                    My Hunt
                    {huntActive && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta"></span>
                      </span>
                    )}
                  </Link>
                  <Link to="/community" onClick={onClose} className={linkCls} activeProps={{ className: activeCls }}>
                    Community
                  </Link>
                  <Link to="/profile" onClick={onClose} className={linkCls} activeProps={{ className: activeCls }}>
                    Profile
                  </Link>
                  <Link to="/applications" onClick={onClose} className={linkCls} activeProps={{ className: activeCls }}>
                    Applications
                  </Link>
                </>
              )}
              <Link to="/feedback" onClick={onClose} className={linkCls} activeProps={{ className: activeCls }}>
                Feedback
              </Link>
            </nav>
          </div>

          <div className="border-t border-cardborder pt-6 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs uppercase tracking-wider text-mutedtext">Theme</span>
              <ThemeToggle />
            </div>

            {user ? (
              <div className="rounded-card border border-cardborder bg-cardbg p-4 space-y-3">
                <div className="text-xs text-mutedtext truncate">
                  Signed in as <strong className="text-cream block truncate">{user.name || user.email}</strong>
                </div>
                <button
                  onClick={() => {
                    onRequestLogout();
                  }}
                  className="w-full rounded-card border border-terracotta/40 py-2.5 text-sm font-bold uppercase tracking-wider text-terracotta hover:bg-terracotta hover:text-darkbg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="rounded-card border border-cardborder py-2.5 text-center text-xs font-semibold text-cream hover:bg-cardbg-hover transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="rounded-card bg-terracotta py-2.5 text-center text-xs font-semibold text-darkbg hover:opacity-90 transition-opacity"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
export default MobileMenu;
