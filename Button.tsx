import React from "react";
import clsx from "clsx";

export type Variant =
  | "primary"
  | "white"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "help"
  | "danger";

export type Appearance = "filled" | "outlined";

export type Size = "sm" | "md" | "lg";

export type Variants = {
  [key in Variant]: {
    [key in Appearance]: string;
  };
};

export type Sizes = {
  [key in Size]: string;
};

export type ButtonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  appearance?: Appearance;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  appearance = "filled",
  className,
  ...props
}) => {
  const baseStyles: string = "rounded-lg font-medium transition-all";

  const variants: Variants = {
    primary: {
      filled: "bg-blue-800 text-white hover:bg-blue-900",
      outlined:
        "border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50",
    },
    white: {
      filled: "bg-white text-gray-800 hover:bg-gray-100",
      outlined:
        "border border-gray-600 text-gray-600 bg-transparent hover:bg-gray-50",
    },
    secondary: {
      filled: "bg-slate-500 text-white hover:bg-slate-600",
      outlined:
        "border border-slate-500 text-slate-500 bg-transparent hover:bg-slate-50",
    },
    success: {
      filled: "bg-green-500 text-white hover:bg-green-600",
      outlined:
        "border border-green-600 text-green-600 bg-transparent hover:bg-green-50",
    },
    info: {
      filled: "bg-blue-500 text-white hover:bg-blue-600",
      outlined:
        "border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-50",
    },
    warning: {
      filled: "bg-yellow-500 text-white hover:bg-yellow-600",
      outlined:
        "border border-yellow-600 text-yellow-600 bg-transparent hover:bg-yellow-50",
    },
    help: {
      filled: "bg-purple-500 text-white hover:bg-purple-600",
      outlined:
        "border border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50",
    },
    danger: {
      filled: "bg-red-500 text-white hover:bg-red-600",
      outlined:
        "border border-red-600 text-red-600 bg-transparent hover:bg-red-50",
    },
  };

  const sizes: Sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant][appearance],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
