"use client";

import { useEffect, useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

type Props<T extends FieldValues> = {
  label: string;
  name: Path<T>;
  control: Control<T>;
  rows?: number;
  disabled?: boolean;
};

export function JsonTextareaField<T extends FieldValues>({
  label,
  name,
  control,
  rows = 6,
  disabled,
}: Props<T>) {
  const { field, fieldState } = useController({ control, name });
  const [text, setText] = useState(() => stringifyJson(field.value));
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    setText(stringifyJson(field.value));
    setParseError(null);
  }, [field.value]);

  const handleBlur = () => {
    field.onBlur();
    try {
      const parsed = text.trim() ? JSON.parse(text) : {};
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setParseError("JSON must be an object");
        return;
      }
      setParseError(null);
      field.onChange(parsed);
    } catch {
      setParseError("Invalid JSON");
    }
  };

  const error = parseError || fieldState.error?.message;

  return (
    <label className="space-y-1">
      <div className="text-sm font-medium text-zinc-950">{label}</div>
      <textarea
        rows={rows}
        disabled={disabled}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={handleBlur}
        className="w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none focus:border-zinc-950"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function stringifyJson(value: unknown) {
  if (!value || typeof value !== "object") return "{}";
  return JSON.stringify(value, null, 2);
}
