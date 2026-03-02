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
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

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

type Visit = { id: string; checkIn: string; region?: string };

function formatKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function MrCalendarWidget({ visits }: { visits: Visit[] }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const todayKey = formatKey(new Date());

  const visitsByDay = useMemo(() => {
    const map = new Map<string, Visit[]>();
    for (const visit of visits) {
      const d = new Date(visit.checkIn);
      if (Number.isNaN(d.getTime())) continue;
      const key = formatKey(d);
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

    // Previous month tail
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      cells.push({ date: new Date(year, month - 1, day), isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Next month head to fill complete weeks
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

  const selectedKey = selectedDate ? formatKey(selectedDate) : null;
  const selectedVisits = selectedKey ? visitsByDay.get(selectedKey) ?? [] : [];

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

  return (
    <div className="bg-white dark:bg-card rounded-3xl border-2 border-gray-400 dark:border-gray-600 p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5">
        <h2 className="text-[14px] sm:text-[16px] font-semibold text-slate-900 dark:text-slate-50">
          {headerLabel}
        </h2>
        <Button
          type="button"
          size="sm"
          className="rounded-full !bg-[#0b1b53] hover:!bg-[#0b1b53]/90 dark:!bg-blue-600 dark:hover:!bg-blue-600/90 !text-white px-3.5 sm:px-4 h-8 text-[11px] sm:text-[12px] font-medium"
        >
          Full calendar
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2.5 sm:w-auto">
          <select
            value={String(currentYear)}
            onChange={handleYearChange}
            className="rounded-full border-2 border-gray-300 dark:border-gray-500 h-9 px-3 text-[12px] sm:text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={currentMonthName}
            onChange={handleMonthChange}
            className="rounded-full border-2 border-gray-300 dark:border-gray-500 h-9 px-3 text-[12px] sm:text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
          >
            {monthLabels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            size="icon"
            className="h-8 w-8 flex items-center justify-center rounded-full text-white"
            onClick={handlePrevMonth}
          >
            {"<"}
            <ChevronLeft className="h-4 w-4 text-white" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleNextMonth}
          >
            {">"}
            {/* <ChevronRight className="h-4 w-4" /> */}
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-[3px] sm:gap-1 mb-1">
          {dayLabels.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300 py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
          {calendarCells.map((cell) => {
            const key = formatKey(cell.date);
            const hasVisits = (visitsByDay.get(key)?.length ?? 0) > 0;
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className="relative h-16 aspect-square flex items-center justify-center"
              >
                <button
                  type="button"
                  onClick={() => handleDayClick(cell.date)}
                  className={[
                    "w-full h-20 rounded-lg  text-[11px] sm:text-[12px] font-medium transition-colors border border-transparent",
                    cell.isCurrentMonth
                      ? "text-slate-900 dark:text-slate-50"
                      : "text-slate-400 dark:text-slate-500",
                    isToday
                      ? "bg-[#0b1b53] dark:bg-blue-600 text-white font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800",
                    hasVisits && !isToday
                      ? "border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/30"
                      : "",
                  ].join(" ")}
                >
                  {cell.date.getDate()}
                </button>
                {hasVisits && !isToday && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-sky-500" />
                    <div className="w-1 h-1 rounded-full bg-pink-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day overview dialog */}
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
            <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
              No visits recorded for this date.
            </div>
          ) : (
            <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
              {selectedVisits.map((visit) => {
                const d = new Date(visit.checkIn);
                return (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">
                        {d.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Region: {visit.region || "—"}
                      </p>
                    </div>
                    {visit.id && (
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
                    )}
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

