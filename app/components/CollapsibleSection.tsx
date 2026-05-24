type CollapsibleSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-white/10 bg-gray-900/80 p-4 shadow-xl shadow-black/10 backdrop-blur sm:p-6"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-400">{description}</p>
            )}
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-lg font-bold text-gray-300 transition-transform duration-300 group-open:rotate-90">
            &gt;
          </span>
        </div>
      </summary>

      <div className="mt-5">{children}</div>
    </details>
  );
}
