import { useEffect, useState } from "react";
export function QuantityInput({
  value,
  max,
  label = "Quantidade",
  onChange,
  onValidityChange,
}: {
  value: number;
  max: number;
  label?: string;
  onChange: (value: number) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => setDraft(String(value)), [value]);
  function valid(text: string) {
    return /^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= max;
  }
  return (
    <label>
      Quantidade
      <input
        aria-label={label}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        aria-invalid={!!error}
        onChange={(e) => {
          const text = e.target.value;
          if (!/^\d*$/.test(text)) return;
          setDraft(text);
          setError("");
          const ok = valid(text);
          onValidityChange?.(ok);
          if (ok) onChange(Number(text));
        }}
        onBlur={() => {
          if (!valid(draft)) {
            setError(`Informe uma quantidade inteira entre 1 e ${max}.`);
            setDraft(String(value));
            onValidityChange?.(true);
          } else {
            setDraft(String(Number(draft)));
          }
        }}
      />
      {error && (
        <span role="alert" className="muted">
          {error}
        </span>
      )}
    </label>
  );
}
