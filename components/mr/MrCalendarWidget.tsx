"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Local calendar day key (avoids UTC off-by-one from toISOString). */
function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type Visit = { id: string; checkIn: string; region?: string };

function formatFullDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const NAVY = "#0b1b53";
const DOT_COLORS = ["bg-teal-500", "bg-sky-400", "bg-fuchsia-500"] as const;

export function MrCalendarWidget({ visits }: { visits: Visit[] }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const todayKey = dayKey(new Date());

  const visitsByDay = useMemo(() => {
    const map = new Map<string, Visit[]>();
    for (const visit of visits) {
      const d = new Date(visit.checkIn);
      if (Number.isNaN(d.getTime())) continue;
      const key = dayKey(d);
      const existing = map.get(key);
      if (existing) {
        existing.push(visit);
      } else {
        map.set(key, [visit]);
      }
    }
    return map;
  }, [visits]);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = startDay;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      cells.push({ date: new Date(year, month - 1, day), isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    const totalCells = Math.ceil(cells.length / 7) * 7;
    let nextDay = 1;
    while (cells.length < totalCells) {
      cells.push({ date: new Date(year, month + 1, nextDay++), isCurrentMonth: false });
    }

    return cells;
  }, [viewDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonthIndex = viewDate.getMonth();
  const currentMonthName = monthLabels[currentMonthIndex];

  const years = useMemo(
    () => [currentYear - 1, currentYear, currentYear + 1],
    [currentYear]
  );

  const headerDate = selectedDate ?? new Date();
  const headerLabel = formatFullDate(headerDate);

  const selectedKey = selectedDate ? dayKey(selectedDate) : null;
  const selectedVisits = selectedKey ? visitsByDay.get(selectedKey) ?? [] : [];

  /** Navy highlight: explicit selection, else today when nothing picked yet. */
  const primaryKey = selectedDate ? dayKey(selectedDate) : todayKey;

  const handlePrevMonth = () => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    );
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number(e.target.value);
    if (Number.isNaN(newYear)) return;
    setViewDate(new Date(newYear, viewDate.getMonth(), 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthName = e.target.value;
    const idx = monthLabels.indexOf(monthName);
    if (idx === -1) return;
    setViewDate(new Date(viewDate.getFullYear(), idx, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const selectClass =
    "h-8 w-full min-w-0 cursor-pointer appearance-none rounded-full border border-gray-200 bg-white pl-3 pr-8 text-xs font-medium text-gray-900 shadow-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/80 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-500 dark:focus-visible:ring-gray-600";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-sm font-semibold leading-snug text-[#0a1628] dark:text-gray-50">
            {headerLabel}
          </h2>
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-full px-3 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: NAVY }}
          >
            Full calendar
          </Button>
        </div>

        {/* Year / month + month nav */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="relative grid flex-1 grid-cols-2 gap-2">
            <div className="relative">
              <select
                value={String(currentYear)}
                onChange={handleYearChange}
                aria-label="Year"
                className={selectClass}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
            </div>
            <div className="relative">
              <select
                value={currentMonthName}
                onChange={handleMonthChange}
                aria-label="Month"
                className={selectClass}
              >
                {monthLabels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Calendar grid — compact */}
        <div className="pt-0.5">
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {dayLabels.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((cell, idx) => {
              const key = dayKey(cell.date);
              const visitList = visitsByDay.get(key);
              const hasVisits = (visitList?.length ?? 0) > 0;
              const isPrimary = key === primaryKey;

              return (
                <div
                  key={`${key}-${idx}`}
                  className="flex aspect-square max-h-9 min-h-0 items-center justify-center p-0"
                >
                  <button
                    type="button"
                    onClick={() => handleDayClick(cell.date)}
                    className={
                      isPrimary
                        ? "flex h-full w-full max-h-9 min-h-[2rem] flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-0.5 text-[11px] font-semibold text-white shadow-sm transition-colors"
                        : [
                            "flex h-full w-full max-h-9 min-h-[2rem] flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/80",
                            cell.isCurrentMonth
                              ? "text-gray-900 dark:text-gray-50"
                              : "text-gray-400 dark:text-gray-500",
                            hasVisits ? "bg-gray-50 dark:bg-gray-900/50" : "",
                          ].join(" ")
                    }
                    style={isPrimary ? { backgroundColor: NAVY } : undefined}
                  >
                    <span className="leading-none">{cell.date.getDate()}</span>
                    {hasVisits ? (
                      <span className="flex gap-px" aria-hidden>
                        <span
                          className={
                            isPrimary
                              ? "h-1 w-1 rounded-full bg-teal-200"
                              : `h-1 w-1 rounded-full ${DOT_COLORS[0]}`
                          }
                        />
                        <span
                          className={
                            isPrimary
                              ? "h-1 w-1 rounded-full bg-sky-200"
                              : `h-1 w-1 rounded-full ${DOT_COLORS[1]}`
                          }
                        />
                        <span
                          className={
                            isPrimary
                              ? "h-1 w-1 rounded-full bg-fuchsia-200"
                              : `h-1 w-1 rounded-full ${DOT_COLORS[2]}`
                          }
                        />
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? `Visits on ${formatFullDate(selectedDate)}` : "Day overview"}
            </DialogTitle>
            <DialogDescription>
              Quick overview of pharmacy visits recorded on this day.
            </DialogDescription>
          </DialogHeader>

          {selectedVisits.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
              No visits recorded for this date.
            </div>
          ) : (
            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
              {selectedVisits.map((visit) => {
                const d = new Date(visit.checkIn);
                return (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900/60"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">
                        {d.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Region: {visit.region || "—"}
                      </p>
                    </div>
                    {visit.id ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                      >
                        <Link href={`/mr/visit/${visit.id}`}>
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          View
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
