import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
import { ErrorIcon } from "./icons/error-icon";
import { cn } from "../lib/utils";
import { Label } from "./label";

/* ── Flag helper ── */
function flag(code: string): string {
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

/* ── Mask formatter ── */
// '#' = digit slot, everything else is a literal separator
function applyMask(digits: string, mask: string): string {
  let di = 0;
  let result = "";
  for (const ch of mask) {
    if (di >= digits.length) break;
    if (ch === "#") {
      result += digits[di++];
    } else {
      result += ch;
    }
  }
  return result;
}

function stripDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/* ── Country data ── */
export interface PhoneCountry {
  code: string;
  name: string;
  dial: string;
  /** '#' = digit, literals are separators (e.g. "(###) ###-####") */
  mask: string;
  /** Human-readable example matching the mask */
  example: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "us", name: "United States",        dial: "+1",   mask: "(###) ###-####",  example: "(555) 555-5555" },
  { code: "ca", name: "Canada",               dial: "+1",   mask: "(###) ###-####",  example: "(555) 555-5555" },
  { code: "gb", name: "United Kingdom",       dial: "+44",  mask: "##### ######",    example: "07911 123456" },
  { code: "au", name: "Australia",            dial: "+61",  mask: "### ### ###",     example: "412 345 678" },
  { code: "de", name: "Germany",              dial: "+49",  mask: "### ########",    example: "030 12345678" },
  { code: "fr", name: "France",               dial: "+33",  mask: "# ## ## ## ##",  example: "6 12 34 56 78" },
  { code: "jp", name: "Japan",                dial: "+81",  mask: "###-####-####",   example: "090-1234-5678" },
  { code: "cn", name: "China",                dial: "+86",  mask: "### #### ####",   example: "138 1234 5678" },
  { code: "in", name: "India",                dial: "+91",  mask: "##### #####",     example: "98765 43210" },
  { code: "br", name: "Brazil",               dial: "+55",  mask: "(##) #####-####", example: "(11) 91234-5678" },
  { code: "mx", name: "Mexico",               dial: "+52",  mask: "## #### ####",    example: "55 1234 5678" },
  { code: "es", name: "Spain",                dial: "+34",  mask: "### ### ###",     example: "612 345 678" },
  { code: "it", name: "Italy",                dial: "+39",  mask: "### ### ####",    example: "312 345 6789" },
  { code: "nl", name: "Netherlands",          dial: "+31",  mask: "# ########",      example: "6 12345678" },
  { code: "se", name: "Sweden",               dial: "+46",  mask: "## ### ## ##",    example: "70 123 45 67" },
  { code: "no", name: "Norway",               dial: "+47",  mask: "### ## ###",      example: "400 12 345" },
  { code: "dk", name: "Denmark",              dial: "+45",  mask: "## ## ## ##",     example: "20 12 34 56" },
  { code: "fi", name: "Finland",              dial: "+358", mask: "## #######",      example: "40 1234567" },
  { code: "ch", name: "Switzerland",          dial: "+41",  mask: "## ### ## ##",    example: "76 123 45 67" },
  { code: "at", name: "Austria",              dial: "+43",  mask: "### ######",      example: "664 123456" },
  { code: "be", name: "Belgium",              dial: "+32",  mask: "### ## ## ##",    example: "470 12 34 56" },
  { code: "pl", name: "Poland",               dial: "+48",  mask: "### ### ###",     example: "512 345 678" },
  { code: "pt", name: "Portugal",             dial: "+351", mask: "### ### ###",     example: "912 345 678" },
  { code: "ru", name: "Russia",               dial: "+7",   mask: "###-###-##-##",   example: "912-345-67-89" },
  { code: "za", name: "South Africa",         dial: "+27",  mask: "## ### ####",     example: "71 234 5678" },
  { code: "ng", name: "Nigeria",              dial: "+234", mask: "### ### ####",    example: "802 123 4567" },
  { code: "eg", name: "Egypt",                dial: "+20",  mask: "### ### ####",    example: "100 123 4567" },
  { code: "ke", name: "Kenya",                dial: "+254", mask: "### ######",      example: "712 345678" },
  { code: "ae", name: "United Arab Emirates", dial: "+971", mask: "## ### ####",     example: "50 123 4567" },
  { code: "sa", name: "Saudi Arabia",         dial: "+966", mask: "## ### ####",     example: "51 234 5678" },
  { code: "il", name: "Israel",               dial: "+972", mask: "##-###-####",     example: "50-123-4567" },
  { code: "tr", name: "Turkey",               dial: "+90",  mask: "### ### ## ##",   example: "532 123 45 67" },
  { code: "kr", name: "South Korea",          dial: "+82",  mask: "##-####-####",    example: "10-1234-5678" },
  { code: "sg", name: "Singapore",            dial: "+65",  mask: "#### ####",       example: "8123 4567" },
  { code: "my", name: "Malaysia",             dial: "+60",  mask: "##-#### ####",    example: "12-3456 7890" },
  { code: "id", name: "Indonesia",            dial: "+62",  mask: "###-####-####",   example: "812-3456-7890" },
  { code: "ph", name: "Philippines",          dial: "+63",  mask: "### ### ####",    example: "917 123 4567" },
  { code: "nz", name: "New Zealand",          dial: "+64",  mask: "## ### ####",     example: "21 123 4567" },
  { code: "ar", name: "Argentina",            dial: "+54",  mask: "## ####-####",    example: "11 1234-5678" },
  { code: "cl", name: "Chile",                dial: "+56",  mask: "# #### ####",     example: "9 1234 5678" },
  { code: "co", name: "Colombia",             dial: "+57",  mask: "### ### ####",    example: "310 123 4567" },
  { code: "pe", name: "Peru",                 dial: "+51",  mask: "### ### ###",     example: "912 345 678" },
  { code: "ie", name: "Ireland",              dial: "+353", mask: "## ### ####",     example: "85 123 4567" },
  { code: "gr", name: "Greece",               dial: "+30",  mask: "### ### ####",    example: "694 123 4567" },
  { code: "cz", name: "Czech Republic",       dial: "+420", mask: "### ### ###",     example: "601 123 456" },
  { code: "hu", name: "Hungary",              dial: "+36",  mask: "## ### ####",     example: "20 123 4567" },
  { code: "ro", name: "Romania",              dial: "+40",  mask: "### ### ###",     example: "712 345 678" },
];

/* ── Validation ── */
function maskDigitCount(mask: string): number {
  return mask.split("").filter((c) => c === "#").length;
}

function validatePhone(digits: string, country: PhoneCountry): string | null {
  if (!digits) return null;
  const expected = maskDigitCount(country.mask);
  if (digits.length !== expected) {
    return `Enter a valid ${country.name} number (${expected} digits). Example: ${country.example}`;
  }
  return null;
}

/** True once `digits` (raw, unformatted — same shape as `PhoneValue.number`)
 *  is a complete number for `country` — the same completeness check
 *  PhoneInput uses internally to decide whether to show its own validation
 *  error. Exported so a consumer that wants to gate an action (e.g. enabling
 *  a "Dial Number" submit button) on a valid number can reuse this instead
 *  of re-deriving the per-country digit count itself — see CONTRIBUTING.md
 *  §1 ("never hard-code around a real component's own logic"). */
export function isPhoneNumberComplete(digits: string, country: PhoneCountry): boolean {
  return digits.length === maskDigitCount(country.mask);
}

/* ── Types ── */
export interface PhoneValue {
  countryCode: string;
  /** Raw digits only — no formatting, no dial code */
  number: string;
}

export interface PhoneInputProps {
  value?: PhoneValue;
  onChange?: (value: PhoneValue) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  label?: string;
  labelHelpText?: string;
  required?: boolean;
  className?: string;
  id?: string;
  /**
   * Hides the country/dial-code selector, rendering a plain single-country number field.
   * `defaultCountry` (or `value.countryCode`) still determines the mask/format used —
   * it just can't be changed from the UI. Defaults to false.
   */
  hideCountrySelector?: boolean;
  /**
   * Extra className for the country dropdown panel itself (not the field
   * shell — use `className` for that). Mainly for overriding its z-index:
   * the dropdown defaults to `z-50`, which is correct in normal flow but
   * sits below any `z-[9999]`+ portal it might be nested inside (e.g.
   * CreateNew's own popover panel) — see CONTRIBUTING.md §5 "Z-index
   * hierarchy", the same nested-popover case as `Popover`'s own
   * `z-[10003]` per-row flyout.
   */
  dropdownClassName?: string;
}

/* ── Component ── */

const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  ({
    value,
    onChange,
    defaultCountry = "us",
    placeholder,
    disabled,
    readonly,
    label,
    labelHelpText,
    required,
    className,
    id,
    hideCountrySelector = false,
    dropdownClassName,
  }, ref) => {
    const autoId    = React.useId();
    const inputId   = id ?? autoId;
    const searchRef = React.useRef<HTMLInputElement>(null);

    const [open,        setOpen]        = React.useState(false);
    const [search,      setSearch]      = React.useState("");
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [touched,     setTouched]     = React.useState(false);

    const countryCode = value?.countryCode ?? defaultCountry;
    const rawDigits   = value?.number ?? "";

    const selected    = PHONE_COUNTRIES.find((c) => c.code === countryCode) ?? PHONE_COUNTRIES[0];
    const formatted   = applyMask(rawDigits, selected.mask);
    const error       = touched ? validatePhone(rawDigits, selected) : null;
    const ph          = placeholder ?? selected.example;

    const filtered = React.useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return PHONE_COUNTRIES;
      return PHONE_COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.includes(q)
      );
    }, [search]);

    React.useEffect(() => { setActiveIndex(-1); }, [filtered.length]);
    React.useEffect(() => {
      if (open) setTimeout(() => searchRef.current?.focus(), 50);
      else setSearch("");
    }, [open]);

    const selectCountry = (c: PhoneCountry) => {
      onChange?.({ countryCode: c.code, number: rawDigits });
      setOpen(false);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = stripDigits(e.target.value);
      const maxDigits = maskDigitCount(selected.mask);
      onChange?.({ countryCode, number: digits.slice(0, maxDigits) });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
        case "ArrowUp":   e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); break;
        case "Enter":     e.preventDefault(); if (activeIndex >= 0 && filtered[activeIndex]) selectCountry(filtered[activeIndex]); break;
        case "Escape":    setOpen(false); break;
      }
    };

    const shellClass = cn(
      "flex h-9 w-full rounded-lyra-sm border lyra-body-md transition-colors overflow-hidden",
      "bg-lyra-bg-field text-lyra-fg-default",
      error
        ? "border-lyra-status-critical-strong hover:border-lyra-status-critical-strong focus-within:border-lyra-status-critical-strong focus-within:ring-2 focus-within:ring-lyra-status-critical-strong/20"
        : "border-lyra-border-strong hover:border-lyra-state-border-hover-neutral focus-within:border-lyra-border-active focus-within:ring-2 focus-within:ring-lyra-border-active/20",
      disabled && "bg-lyra-bg-disabled border-transparent",
      readonly  && "bg-lyra-bg-surface-canvas pointer-events-none"
    );

    /* Number input — displays formatted, stores digits. Shared between both layouts. */
    const numberInput = (
      <input
        id={inputId}
        type="tel"
        value={formatted}
        onChange={handleNumberChange}
        onBlur={() => setTouched(true)}
        placeholder={ph}
        disabled={disabled}
        readOnly={readonly}
        autoComplete="tel"
        className="flex-1 bg-transparent outline-none px-3 truncate placeholder:text-lyra-fg-disabled disabled:cursor-not-allowed"
        aria-label={label ?? "Phone number"}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
    );

    return (
      <div ref={ref} className={className}>
        {label && (
          <Label label={label} labelFor={inputId} labelHelpText={labelHelpText}
            required={required} disabled={disabled} readonly={readonly}
            className="block mb-1.5" />
        )}

        {hideCountrySelector ? (
          /* Single-country mode — no dial-code selector, just the formatted number field */
          <div className={shellClass}>{numberInput}</div>
        ) : (
          <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Anchor asChild>
              <div className={shellClass}>
                {/* Country selector */}
                <PopoverPrimitive.Trigger asChild>
                  <button
                    type="button"
                    disabled={disabled || readonly}
                    aria-label={`Select country, currently ${selected.name}`}
                    aria-expanded={open} aria-haspopup="listbox"
                    onClick={() => !disabled && !readonly && setOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 pl-3 pr-2 border-r shrink-0 transition-colors focus:outline-none",
                      error ? "border-lyra-status-critical-strong" : "border-lyra-border-strong",
                      "hover:bg-lyra-state-hover disabled:cursor-not-allowed disabled:opacity-40"
                    )}
                  >
                    <span className="text-base leading-none">{flag(selected.code)}</span>
                    <span className="lyra-body-md text-lyra-fg-secondary tabular-nums">{selected.dial}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 text-lyra-fg-secondary transition-transform", open && "rotate-180")}
                      strokeWidth={1.5}
                    />
                  </button>
                </PopoverPrimitive.Trigger>

                {numberInput}
              </div>
            </PopoverPrimitive.Anchor>

            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                onOpenAutoFocus={(e) => e.preventDefault()}
                side="bottom" sideOffset={4} align="start"
                avoidCollisions collisionPadding={4}
                style={{ width: "var(--radix-popover-trigger-width)" }}
                className={cn(
                  "z-50 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg",
                  "flex flex-col max-h-72",
                  "animate-in fade-in-0 slide-in-from-top-2 duration-150",
                  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100",
                  dropdownClassName
                )}
              >
                {/* Search */}
                <div className="p-2 border-b border-lyra-border-subtle shrink-0">
                  <div className="relative flex items-center">
                    <input
                      ref={searchRef} type="text" value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search country…"
                      className={cn(
                        "w-full h-8 pl-3 pr-8 rounded-lyra-sm border lyra-body-md",
                        "bg-lyra-bg-field border-lyra-border-strong",
                        "focus:outline-none focus:border-lyra-border-active focus:ring-2 focus:ring-lyra-border-active/20",
                        "placeholder:text-lyra-fg-disabled"
                      )}
                    />
                    {search && (
                      <button type="button" tabIndex={-1} onClick={() => setSearch("")}
                        className="absolute right-2 text-lyra-fg-secondary hover:text-lyra-fg-default">
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div role="listbox" aria-label="Countries" className="overflow-y-auto p-2">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2.5 lyra-body-md text-lyra-fg-disabled">No countries found</div>
                  ) : (
                    filtered.map((c, i) => (
                      <div
                        key={`${c.code}-${c.dial}`}
                        role="option" aria-selected={c.code === countryCode}
                        onMouseDown={(e) => { e.preventDefault(); selectCountry(c); }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-lyra-sm lyra-body-md cursor-pointer transition-colors select-none",
                          c.code === countryCode
                            ? "bg-lyra-bg-active-subtle text-lyra-fg-active-strong"
                            : "text-lyra-fg-default",
                          i === activeIndex && c.code !== countryCode && "bg-lyra-state-hover"
                        )}
                      >
                        <span className="text-base leading-none shrink-0">{flag(c.code)}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="lyra-body-sm text-lyra-fg-secondary tabular-nums shrink-0">{c.dial}</span>
                      </div>
                    ))
                  )}
                </div>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
        )}

        {/* Error */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 lyra-body-sm text-lyra-status-critical-strong flex items-start gap-1">
            <ErrorIcon className="h-4 w-4 shrink-0 mt-px" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
