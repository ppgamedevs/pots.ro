import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

// Base button styles with improved UX
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-4 py-2 font-medium transition-micro focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white border-primary hover:bg-primary/90 shadow-sm",
        secondary: "bg-white text-ink border-line hover:bg-bg-soft",
        ghost: "bg-transparent text-ink border-transparent hover:bg-bg-soft",
        outline: "bg-transparent text-ink border-line hover:bg-bg-soft",
        destructive: "bg-red-500 text-white border-red-500 hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm", 
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
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
