import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 shadow-neon hover:bg-cyan-400/25 hover:text-white",
  secondary:
    "border-purple-300/50 bg-purple-500/15 text-purple-100 shadow-purple hover:bg-purple-500/25 hover:text-white",
  danger:
    "border-rose-300/50 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 hover:text-white",
  ghost: "border-slate-500/30 bg-slate-900/40 text-slate-200 hover:border-slate-300/50 hover:bg-slate-800/70"
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
