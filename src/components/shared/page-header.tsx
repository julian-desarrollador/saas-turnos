import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div>
      {eyebrow ? <div className="text-muted-foreground mb-2 text-sm">{eyebrow}</div> : null}
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
    </div>
  );
}
