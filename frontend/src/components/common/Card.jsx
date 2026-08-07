import React from "react";

const Card = ({
  variant = "default",
  padding = "md",
  interactive = false,
  className = "",
  children,
  onClick,
  ...props
}) => {
  const baseClasses = "rounded-[var(--radius-card)]";

  const paddingMap = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    none: "p-0"
  };

  const variantMap = {
    default: "bg-white border border-[var(--border-default)]",
    outlined: "bg-transparent border border-[var(--border-default)]",
    elevated: "bg-white border-none shadow-[var(--shadow-card-md)]",
    transparent: "bg-transparent border-none"
  };

  const interactiveClasses = interactive ?
  "cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[var(--shadow-card-lg)]" :
  "";

  const defaultShadow = variant === "default" ? "shadow-[var(--shadow-card-sm)]" : "";

  const classes = [
  baseClasses,
  paddingMap[padding] || paddingMap.md,
  variantMap[variant] || variantMap.default,
  interactiveClasses,
  defaultShadow,
  className].

  filter(Boolean).
  join(" ");

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>);

};

export default Card;