import { InputHTMLAttributes, forwardRef } from "react";
import styles from "./input.module.css";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const classes = [styles.input, className].filter(Boolean).join(" ");
    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = "Input";
