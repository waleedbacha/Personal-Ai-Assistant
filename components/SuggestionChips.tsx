'use client';

type Props = {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function SuggestionChips({ suggestions, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((s, i) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(s)}
          style={{ animationDelay: `${0.3 + i * 0.05}s` }}
          className="animate-fade-in-up rounded-full border border-border bg-bg-soft/50 px-4 py-2 text-xs text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-bg-soft hover:text-fg hover:shadow-[0_4px_20px_rgba(201,169,97,0.15)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {s}
        </button>
      ))}
    </div>
  );
}