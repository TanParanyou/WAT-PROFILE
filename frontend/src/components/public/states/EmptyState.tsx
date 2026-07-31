export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-site-border bg-site-canvas px-5 py-8 text-center">
      <h3 className="text-lg font-semibold text-site-foreground">{title}</h3>
      <p className="mt-2 text-sm text-site-body">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
