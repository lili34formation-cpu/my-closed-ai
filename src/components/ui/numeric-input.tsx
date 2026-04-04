import * as React from "react";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | "";
  onValueChange: (value: number) => void;
  /** Show formatted display on blur (e.g. "3,50") */
  formatDisplay?: boolean;
  /** Number of decimal places for display formatting */
  decimals?: number;
  /** Suffix shown in formatted display (e.g. " €") */
  suffix?: string;
  /** Allow only integers */
  integer?: boolean;
}

/** Parse input string accepting both comma and dot as decimal separator */
function parseDecimal(raw: string): number {
  const normalized = raw.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Format number to locale string */
function formatNumber(value: number, decimals: number, suffix: string): string {
  if (value === 0) return "";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + suffix;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, value, onValueChange, formatDisplay = false, decimals = 2, suffix = "", integer = false, ...props }, ref) => {
    const [rawValue, setRawValue] = React.useState<string>("");
    const [focused, setFocused] = React.useState(false);

    // Sync rawValue when value changes externally and not focused
    React.useEffect(() => {
      if (!focused) {
        if (value === "" || value === 0) {
          setRawValue("");
        } else {
          setRawValue(
            formatDisplay
              ? formatNumber(value, decimals, suffix)
              : String(value).replace(".", ",")
          );
        }
      }
    }, [value, focused, formatDisplay, decimals, suffix]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      // Show raw editable value on focus
      if (value !== "" && value !== 0) {
        setRawValue(String(value).replace(".", ","));
      } else {
        setRawValue("");
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const parsed = parseDecimal(rawValue);
      const finalValue = integer ? Math.round(parsed) : parsed;
      onValueChange(finalValue);
      if (formatDisplay && finalValue !== 0) {
        setRawValue(formatNumber(finalValue, decimals, suffix));
      } else if (finalValue === 0) {
        setRawValue("");
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Allow digits, comma, dot, minus
      const filtered = integer
        ? input.replace(/[^0-9-]/g, "")
        : input.replace(/[^0-9.,-]/g, "");
      setRawValue(filtered);
      onValueChange(parseDecimal(filtered));
    };

    return (
      <input
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        value={rawValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
