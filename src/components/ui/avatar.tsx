import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

/** Initials avatar in the charcoal brand color. */
export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground",
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
