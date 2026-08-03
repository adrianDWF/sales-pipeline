import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{title}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
  );
}
