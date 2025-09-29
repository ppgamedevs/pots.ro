import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

// Base button styles with improved UX
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl border border-gray-300 px-4 py-2 font-medium shadow-sm hover:border-gray-400 hover:shadow focus:outline-none focus:ring-2 focus:ring-black/20 active:translate-y-[1px] transition-all disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white border-brand hover:bg-brand-dark hover:border-brand-dark shadow-brand/25",
        secondary: "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
        ghost: "bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
        outline: "bg-transparent text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
        destructive: "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={clsx(buttonVariants({ variant, size }), className)} {...props} />;
}
