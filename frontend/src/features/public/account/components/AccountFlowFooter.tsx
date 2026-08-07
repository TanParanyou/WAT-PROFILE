import type { ReactNode } from "react";

interface AccountFlowFooterProps {
  primary?: ReactNode;
  secondary?: ReactNode;
  links?: ReactNode;
}

export function AccountFlowFooter({ primary, secondary, links }: AccountFlowFooterProps) {
  if (!primary && !secondary && !links) return null;

  return (
    <div className="space-y-3 border-t border-site-border pt-4">
      {(primary || secondary) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {primary}
          {secondary}
        </div>
      )}
      {links ? <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-site-muted">{links}</div> : null}
    </div>
  );
}
