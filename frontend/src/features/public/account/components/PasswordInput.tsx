"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  className?: string;
}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const t = useTranslations("Account");

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={`${className} pr-12`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute bottom-0 right-0 top-0 flex items-center justify-center px-3 text-site-muted hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={show ? t("hidePassword") : t("showPassword")}
        title={show ? t("hidePassword") : t("showPassword")}
      >
        {show ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
