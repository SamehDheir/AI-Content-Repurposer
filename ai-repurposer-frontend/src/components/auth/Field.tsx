"use client";

interface Props {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
}

/**
 * The mono-labelled rule field used by every auth page and by the slate on the
 * desk: a caps label, an underline rather than a box, and a signal-coloured
 * rule on focus.
 */
export function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  hint,
  autoComplete,
  required = true,
  minLength,
  autoFocus,
}: Props) {
  return (
    <div>
      <label htmlFor={id} className="label mb-2 block text-ink-3">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        spellCheck={false}
        className="slug h-11 w-full border-b border-rule-strong bg-transparent text-[14px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-signal"
      />
      {hint && <p className="label mt-2 text-ink-3">{hint}</p>}
    </div>
  );
}
