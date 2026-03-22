"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  filterMrNavSearchItems,
  getGroupLabel,
  getMrNavSearchItemsForRole,
  type MrNavSearchGroup,
  type MrNavSearchItem,
  type MrNavSearchRole,
} from "@/lib/mr/mr-nav-search";

const GROUPS: MrNavSearchGroup[] = ["main", "reports", "management"];

function flattenInGroupOrder(items: MrNavSearchItem[]): MrNavSearchItem[] {
  const out: MrNavSearchItem[] = [];
  for (const g of GROUPS) {
    out.push(...items.filter((x) => x.group === g));
  }
  return out;
}

export const MrNavSearch = React.forwardRef<
  HTMLInputElement,
  { role: MrNavSearchRole; className?: string }
>(function MrNavSearch({ role, className }, ref) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const allItems = React.useMemo(() => getMrNavSearchItemsForRole(role), [role]);
  const filtered = React.useMemo(
    () => filterMrNavSearchItems(allItems, query),
    [allItems, query]
  );
  const flat = React.useMemo(() => flattenInGroupOrder(filtered), [filtered]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, filtered]);

  const navigate = React.useCallback(
    (url: string) => {
      router.push(url);
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
    },
    [router]
  );

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    if (!open || !listRef.current || flat.length === 0) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-nav-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, flat.length]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter") && flat.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (!open || flat.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) navigate(item.url);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const showPanel = open && (flat.length > 0 || query.trim().length > 0);

  return (
    <div ref={wrapRef} className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        aria-hidden
      />
      <Input
        ref={ref}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="mr-nav-search-listbox"
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        placeholder="Search pages & reports…"
        className="h-10 w-full rounded-full border-slate-800 bg-slate-50/90 pl-10 pr-[4.5rem] text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-300 dark:border-slate-600 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-slate-600"
        aria-label="Search pages and reports"
      />
      <div
        className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex"
        aria-hidden
      >
        <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-800 bg-white px-1 font-mono text-[10px] font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
          ⌘
        </kbd>
        <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-800 bg-white px-1 font-mono text-[10px] font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
          K
        </kbd>
      </div>

      {showPanel ? (
        <div
          id="mr-nav-search-listbox"
          role="listbox"
          aria-label="Suggestions"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,20rem)] overflow-hidden rounded-xl border border-slate-200 bg-popover text-popover-foreground shadow-lg dark:border-slate-600 dark:bg-slate-900"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No matching pages or reports.
            </p>
          ) : (
            <div ref={listRef} className="overflow-y-auto p-1.5">
              {GROUPS.map((group) => {
                const groupItems = filtered.filter((i) => i.group === group);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group} className="mb-2 last:mb-0">
                    <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {getGroupLabel(group)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {groupItems.map((item) => {
                        const indexInFlat = flat.indexOf(item);
                        const active = indexInFlat === activeIndex;
                        return (
                          <button
                            key={item.url}
                            type="button"
                            role="option"
                            aria-selected={active}
                            data-nav-index={indexInFlat}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                              active
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/60 dark:hover:bg-slate-800"
                            )}
                            onMouseEnter={() => setActiveIndex(indexInFlat)}
                            onClick={() => navigate(item.url)}
                          >
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {item.title}
                            </span>
                            <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">
                              {item.url.replace(/^\/mr/, "") || "/"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});

MrNavSearch.displayName = "MrNavSearch";
