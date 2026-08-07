import type { AccountDestination } from "../accountNavigation";

export interface AccountPageContext {
  title: string;
  subtitle: string;
  backHref: AccountDestination;
  backLabel: string;
  eyebrow?: string;
  step?: { current: number; total: number };
}

export function AccountPageHeader({ context }: { context: AccountPageContext }) {
  return (
    <div className="space-y-2">
      {context.eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-site-accent">
          {context.eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading text-3xl font-bold text-site-foreground [text-wrap:balance]">
        {context.title}
      </h1>
      <p className="text-sm text-site-muted">{context.subtitle}</p>
      {context.step ? (
        <p className="text-xs font-semibold text-site-muted" aria-label={`${context.step.current}/${context.step.total}`}>
          {context.step.current}/{context.step.total}
        </p>
      ) : null}
    </div>
  );
}
