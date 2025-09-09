import * as React from "react";
import { cn } from "@/lib/utils";

const typographyVariants = {
  h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  h5: "scroll-m-20 text-lg font-semibold tracking-tight",
  h6: "scroll-m-20 text-base font-semibold tracking-tight",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  blockquote: "mt-6 border-l-2 border-slate-200 dark:border-white/10 pl-6 italic",
  code: "relative rounded bg-slate-100 dark:bg-slate-800 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
  lead: "text-xl text-slate-600 dark:text-slate-300",
  large: "text-lg font-semibold",
  small: "text-sm font-medium leading-none",
  muted: "text-sm text-slate-500 dark:text-slate-400",
};

type TypographyProps = React.HTMLAttributes<HTMLElement> & {
  variant?: keyof typeof typographyVariants;
  as?: React.ElementType;
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "p", as: Component = "p", ...props }, ref) => {
    return (
      <Component
        className={cn(typographyVariants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Typography.displayName = "Typography";

// Individual components for convenience
const H1 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(typographyVariants.h1, className)}
      {...props}
    />
  )
);
H1.displayName = "H1";

const H2 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(typographyVariants.h2, className)}
      {...props}
    />
  )
);
H2.displayName = "H2";

const H3 = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(typographyVariants.h3, className)}
      {...props}
    />
  )
);
H3.displayName = "H3";

const P = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(typographyVariants.p, className)}
      {...props}
    />
  )
);
P.displayName = "P";

const Lead = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(typographyVariants.lead, className)}
      {...props}
    />
  )
);
Lead.displayName = "Lead";

const Large = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(typographyVariants.large, className)}
      {...props}
    />
  )
);
Large.displayName = "Large";

const Small = React.forwardRef<HTMLSmallElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <small
      ref={ref}
      className={cn(typographyVariants.small, className)}
      {...props}
    />
  )
);
Small.displayName = "Small";

const Muted = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(typographyVariants.muted, className)}
      {...props}
    />
  )
);
Muted.displayName = "Muted";

export {
  Typography,
  H1,
  H2,
  H3,
  P,
  Lead,
  Large,
  Small,
  Muted,
  typographyVariants,
};
