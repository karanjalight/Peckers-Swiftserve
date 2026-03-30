"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronsUpDown, MapPin } from "lucide-react";
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

export type PharmacyOption = {
  id: string;
  name: string;
  region: string;
  subRegion?: string | null;
  location: string;
};

export function PharmacyCombobox({
  pharmacies,
  value,
  onChange,
  placeholder = "Select pharmacy…",
}: {
  pharmacies: PharmacyOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => pharmacies.find((p) => p.id === value), [pharmacies, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 min-w-[12rem] flex-1 justify-between rounded-xl border-slate-200/90 bg-white px-3 font-normal shadow-sm transition hover:bg-slate-50/80 sm:min-w-[14rem] dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
            <span className={cn("truncate text-left", !selected && "text-slate-500 dark:text-slate-400")}>
              {selected
                ? `${selected.name} · ${selected.region}${selected.subRegion ? ` / ${selected.subRegion}` : ""}`
                : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-45" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,28rem)] rounded-xl border-slate-200/90 p-0 shadow-xl dark:border-slate-700"
        align="end"
      >
        <Command className="rounded-xl">
          <CommandInput placeholder="Search name or location…" className="h-11" />
          <CommandList>
            <CommandEmpty>No pharmacy matches.</CommandEmpty>
            <CommandGroup>
              {pharmacies.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  keywords={[p.name, p.location, p.region, p.subRegion ?? ""]}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="rounded-lg py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium text-slate-900 dark:text-slate-50">{p.name}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {p.location}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {p.region}
                      {p.subRegion ? ` · ${p.subRegion}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
