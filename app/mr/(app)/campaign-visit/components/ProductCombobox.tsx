"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

export type CatalogProduct = {
  id: string;
  name: string;
  pricePerPack: number;
};

async function mockSearchProducts(query: string, catalog: CatalogProduct[]): Promise<CatalogProduct[]> {
  await new Promise((r) => setTimeout(r, 320));
  const q = query.trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter((p) => p.name.toLowerCase().includes(q));
}

export function ProductCombobox({
  products,
  value,
  onChange,
  disabled,
  placeholder = "Search product…",
  error,
}: {
  products: CatalogProduct[];
  value: string;
  onChange: (productId: string, defaultPrice: number) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CatalogProduct[]>(products);

  const runSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const next = await mockSearchProducts(q, products);
        setResults(next);
      } finally {
        setLoading(false);
      }
    },
    [products],
  );

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      void runSearch(search);
    }, search ? 180 : 0);
    return () => window.clearTimeout(handle);
  }, [open, search, runSearch]);

  useEffect(() => {
    if (open) {
      setSearch("");
      void runSearch("");
    }
  }, [open, runSearch]);

  const selected = products.find((p) => p.id === value);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-11 w-full justify-between rounded-xl border-slate-200/90 bg-white px-3 font-normal shadow-sm transition hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900",
              error && "border-red-300 dark:border-red-900",
            )}
          >
            <span className={cn("truncate", !selected && "text-slate-500 dark:text-slate-400")}>
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-45" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,24rem)] rounded-xl border-slate-200/90 p-0 shadow-xl dark:border-slate-700" align="start">
          <Command shouldFilter={false} className="rounded-xl">
            <CommandInput
              placeholder="Type to search catalog…"
              value={search}
              onValueChange={setSearch}
              className="h-11"
            />
            <CommandList>
              {loading ? (
                <div className="space-y-2 p-3">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No products match.</CommandEmpty>
                  <CommandGroup>
                    {results.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.id}
                        keywords={[p.name]}
                        onSelect={() => {
                          onChange(p.id, p.pricePerPack);
                          setOpen(false);
                        }}
                        className="rounded-lg"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="ml-auto text-xs text-slate-500 tabular-nums dark:text-slate-400">
                          KES {p.pricePerPack.toLocaleString()}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
