"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Brain,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import {
  addManualCalendarEvent,
  CALENDAR_UPDATED_EVENT,
  getDashboardCalendarEvents,
  removeDashboardCalendarEvent,
  updateDashboardCalendarEvent,
  type DashboardCalendarEvent,
  type SyllabusMilestoneType,
} from "@/lib/syllabus-calendar";

const MONTH_NAMES = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

const WEEKDAY_LABELS = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"];

const TYPE_STYLE: Record<
  SyllabusMilestoneType,
  { dot: string; icon: typeof GraduationCap; iconWrap: string; label: string }
> = {
  midterm: {
    dot: "bg-violet-400",
    icon: GraduationCap,
    iconWrap: "bg-violet-400/15 text-violet-500 dark:bg-violet-400/20 dark:text-violet-300",
    label: "შუალედური",
  },
  quiz: {
    dot: "bg-sky-400",
    icon: Brain,
    iconWrap: "bg-sky-400/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300",
    label: "Quiz",
  },
  deadline: {
    dot: "bg-pink-400",
    icon: AlertCircle,
    iconWrap: "bg-pink-400/15 text-pink-600 dark:bg-pink-400/20 dark:text-pink-300",
    label: "დედლაინი",
  },
};

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function eventDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
  return toDateKey(d);
}

function buildMonthCells(viewDate: Date, today: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const dayNumber = i - startOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    return {
      key: toDateKey(cellDate),
      label: cellDate.getDate(),
      inMonth: cellDate.getMonth() === month,
      isToday: toDateKey(cellDate) === toDateKey(today),
    };
  });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "თარიღის არჩევა";
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const PERIOD_OPTIONS = ["AM", "PM"] as const;

function to12Hour(hour24: number): { hour12: string; period: "AM" | "PM" } {
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12: String(hour12).padStart(2, "0"), period };
}

function to24Hour(hour12: string, period: "AM" | "PM"): string {
  let h = parseInt(hour12, 10) % 12;
  if (period === "PM") h += 12;
  return String(h).padStart(2, "0");
}

function parseTimeParts(time: string): { hour12: string; minute: string; period: "AM" | "PM" } {
  if (!time) return { hour12: "09", minute: "00", period: "AM" };
  const [hh, mm] = time.split(":");
  const { hour12, period } = to12Hour(parseInt(hh, 10) || 0);
  return { hour12, minute: mm ?? "00", period };
}

function formatTimeLabel(time: string): string {
  if (!time) return "დროის დამატება";
  const { hour12, minute, period } = parseTimeParts(time);
  return `${hour12}:${minute} ${period}`;
}

interface DashboardCalendarPanelProps {
  variant?: "sidebar" | "inline";
}

export function DashboardCalendarPanel({ variant = "sidebar" }: DashboardCalendarPanelProps = {}) {
  const isSidebar = variant === "sidebar";
  const today = useMemo(() => new Date(), []);
  const [expandedState, setExpanded] = useState(true);
  const expanded = isSidebar ? expandedState : true;
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(today));
  const [events, setEvents] = useState<DashboardCalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(() => toDateKey(today));
  const [formTime, setFormTime] = useState("");
  const [formType, setFormType] = useState<SyllabusMilestoneType>("deadline");
  const [formDescription, setFormDescription] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    const load = () => setEvents(getDashboardCalendarEvents());
    load();
    window.addEventListener(CALENDAR_UPDATED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(CALENDAR_UPDATED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, DashboardCalendarEvent[]>();
    for (const event of events) {
      const key = eventDateKey(event.date);
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => buildMonthCells(viewDate, today), [viewDate, today]);
  const pickerCells = useMemo(() => buildMonthCells(pickerMonth, today), [pickerMonth, today]);

  const selectedEvents = eventsByDate.get(selectedKey) ?? [];
  const isViewingToday = toDateKey(today) === selectedKey;
  const hasEventsToday = (eventsByDate.get(toDateKey(today))?.length ?? 0) > 0;

  const openAddForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDate(selectedKey);
    setFormTime("");
    setFormType("deadline");
    setFormDescription("");
    setPickerMonth(new Date(selectedKey));
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowAddForm(true);
  };

  const openEditForm = (event: DashboardCalendarEvent) => {
    const dateKey = eventDateKey(event.date);
    setEditingId(event.id);
    setFormTitle(event.title);
    setFormDate(dateKey);
    setFormTime(event.time ?? "");
    setFormType(event.type);
    setFormDescription(event.description ?? "");
    setPickerMonth(new Date(dateKey));
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowAddForm(true);
  };

  const handleSubmitEvent = () => {
    if (!formTitle.trim() || !formDate) return;
    const payload = {
      title: formTitle.trim(),
      date: formDate,
      time: formTime || undefined,
      description: formDescription.trim() || undefined,
      type: formType,
    };
    if (editingId) {
      updateDashboardCalendarEvent(editingId, payload);
    } else {
      addManualCalendarEvent(payload);
    }
    setSelectedKey(formDate);
    setViewDate(new Date(formDate));
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleRemoveEvent = (id: string) => {
    removeDashboardCalendarEvent(id);
    if (editingId === id) {
      setShowAddForm(false);
      setEditingId(null);
    }
  };

  const handleExport = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SpaceEdu//Dashboard Calendar//KA",
      ...events.flatMap((event) => {
        const d = new Date(event.date);
        const stamp = Number.isNaN(d.getTime())
          ? ""
          : `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
        return [
          "BEGIN:VEVENT",
          `UID:${event.id}@spaceedu`,
          `SUMMARY:${event.title}`,
          stamp ? `DTSTART;VALUE=DATE:${stamp}` : "",
          "END:VEVENT",
        ].filter(Boolean);
      }),
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spaceedu-calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.aside
      animate={isSidebar ? { width: expanded ? 300 : 76 } : {}}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={
        isSidebar
          ? `sticky top-24 hidden h-fit shrink-0 flex-col gap-4 xl:flex ${expanded ? "overflow-visible" : "overflow-hidden"}`
          : "flex w-full flex-col gap-4 xl:hidden"
      }
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="კალენდრის გამოწევა"
          className="flex w-[76px] flex-col items-center gap-3 rounded-[28px] border border-sky-200 bg-sky-50 py-5 transition-all hover:border-sky-300 dark:border-2 dark:border-sky-400/20 dark:bg-[#121214] dark:hover:border-sky-400/40"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <CalendarDays className="h-5 w-5 text-sky-500 dark:text-sky-300" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-pink-400 text-sm font-bold text-zinc-900 dark:border-pink-400/60 dark:text-white">
            {today.getDate()}
            {hasEventsToday && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pink-400 dark:bg-sky-400" />
            )}
          </span>
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            key="calendar-expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={isSidebar ? "flex w-[300px] flex-col gap-4" : "flex w-full flex-col gap-4"}
          >
            <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 dark:border-2 dark:border-sky-400/20 dark:bg-[#121214]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </p>
                <div className="flex items-center gap-1">
                  {isSidebar && (
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="mr-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition-all hover:bg-black/10 hover:text-zinc-900 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20 dark:hover:text-white"
                      aria-label="კალენდრის ჩაკეცვა"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="წინა თვე"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="შემდეგი თვე"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-1.5 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((wd) => (
                  <p
                    key={wd}
                    className="text-center text-[10px] font-bold uppercase text-sky-500/70 dark:text-sky-300/60"
                  >
                    {wd}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                  const hasEvents = (eventsByDate.get(cell.key)?.length ?? 0) > 0;
                  const isSelected = cell.key === selectedKey;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedKey(cell.key)}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        !cell.inMonth
                          ? "text-zinc-300 dark:text-zinc-700"
                          : isSelected
                            ? "bg-pink-400 text-white dark:bg-pink-400 dark:text-black"
                            : cell.isToday
                              ? "border-2 border-sky-400 text-zinc-900 dark:border-sky-400 dark:text-white"
                              : "text-zinc-700 hover:bg-sky-100 dark:text-zinc-300 dark:hover:bg-white/10"
                      }`}
                    >
                      {cell.label}
                      {hasEvents && !isSelected && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-pink-400 dark:bg-sky-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={showAddForm && !editingId ? () => setShowAddForm(false) : openAddForm}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-pink-400 px-4 py-3 text-xs font-bold text-white transition-all hover:bg-pink-500 active:scale-[0.98] dark:bg-sky-400 dark:text-black dark:hover:bg-sky-300"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  ღონისძიების დამატება
                </button>
                <button
                  type="button"
                  onClick={() => setEvents(getDashboardCalendarEvents())}
                  aria-label="განახლება"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-500 transition-all hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-sky-300 dark:hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 stroke-[1.75]" />
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  aria-label="ექსპორტი"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-500 transition-all hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-sky-300 dark:hover:text-white"
                >
                  <FileText className="h-4 w-4 stroke-[1.75]" />
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2.5 rounded-2xl border border-pink-200 bg-white p-3.5 dark:border-pink-400/20 dark:bg-white/[0.04]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          {editingId ? "ღონისძიების რედაქტირება" : "ახალი ღონისძიება"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingId(null);
                          }}
                          aria-label="დახურვა"
                          className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="სახელი, მაგ. ესეს ჩაბარება"
                        className="w-full rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-pink-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500"
                      />
                      <div className="flex gap-2">
                        <div className="relative w-1/2">
                          <button
                            type="button"
                            onClick={() => {
                              setPickerMonth(new Date(formDate));
                              setShowTimePicker(false);
                              setShowDatePicker((v) => !v);
                            }}
                            className="flex w-full items-center gap-1.5 truncate rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-zinc-900 transition-all hover:border-pink-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-sky-500 dark:text-sky-300" />
                            <span className="truncate">{formatDateLabel(formDate)}</span>
                          </button>
                          {showDatePicker && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                              <div className="absolute left-0 top-full z-50 mt-2 w-[280px] rounded-2xl border border-sky-200 bg-white p-3.5 shadow-xl dark:border-white/10 dark:bg-[#1a1a1f]">
                                <div className="mb-3 flex items-center justify-between">
                                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {MONTH_NAMES[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPickerMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-sky-100 dark:text-zinc-400 dark:hover:bg-white/10"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPickerMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-sky-100 dark:text-zinc-400 dark:hover:bg-white/10"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="mb-1.5 grid grid-cols-7 gap-1">
                                  {WEEKDAY_LABELS.map((wd) => (
                                    <p
                                      key={wd}
                                      className="text-center text-[10px] font-bold uppercase text-sky-500/70 dark:text-sky-300/60"
                                    >
                                      {wd[0]}
                                    </p>
                                  ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {pickerCells.map((cell) => {
                                    const isSelected = cell.key === formDate;
                                    return (
                                      <button
                                        key={cell.key}
                                        type="button"
                                        onClick={() => {
                                          setFormDate(cell.key);
                                          setShowDatePicker(false);
                                        }}
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                          !cell.inMonth
                                            ? "text-zinc-300 dark:text-zinc-700"
                                            : isSelected
                                              ? "bg-pink-400 text-white dark:bg-sky-400 dark:text-black"
                                              : cell.isToday
                                                ? "border-2 border-sky-400 text-zinc-900 dark:border-sky-400 dark:text-white"
                                                : "text-zinc-700 hover:bg-sky-100 dark:text-zinc-300 dark:hover:bg-white/10"
                                        }`}
                                      >
                                        {cell.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormDate(toDateKey(today));
                                    setPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                    setShowDatePicker(false);
                                  }}
                                  className="mt-2.5 w-full rounded-full py-1.5 text-xs font-bold text-pink-500 hover:bg-pink-50 dark:text-sky-300 dark:hover:bg-white/5"
                                >
                                  დღეს
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="relative w-1/2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDatePicker(false);
                              setShowTimePicker((v) => !v);
                            }}
                            className="flex w-full items-center gap-1.5 truncate rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold text-zinc-900 transition-all hover:border-pink-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0 text-sky-500 dark:text-sky-300" />
                            <span className="truncate">{formatTimeLabel(formTime)}</span>
                          </button>
                          {showTimePicker && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowTimePicker(false)} />
                              <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-sky-200 bg-white p-2.5 shadow-xl dark:border-white/10 dark:bg-[#1a1a1f]">
                                <div className="flex gap-1.5">
                                  <div className="h-40 w-2/5 overflow-y-auto">
                                    {HOUR_OPTIONS.map((h) => {
                                      const parts = parseTimeParts(formTime);
                                      const active = parts.hour12 === h;
                                      return (
                                        <button
                                          key={h}
                                          type="button"
                                          onClick={() =>
                                            setFormTime(`${to24Hour(h, parts.period)}:${parts.minute}`)
                                          }
                                          className={`w-full rounded-lg py-1.5 text-center text-sm font-semibold transition-all ${
                                            active
                                              ? "bg-pink-400 text-white dark:bg-sky-400 dark:text-black"
                                              : "text-zinc-600 hover:bg-sky-100 dark:text-zinc-300 dark:hover:bg-white/10"
                                          }`}
                                        >
                                          {h}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="h-40 w-2/5 overflow-y-auto">
                                    {MINUTE_OPTIONS.map((m) => {
                                      const parts = parseTimeParts(formTime);
                                      const active = parts.minute === m;
                                      return (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() =>
                                            setFormTime(`${to24Hour(parts.hour12, parts.period)}:${m}`)
                                          }
                                          className={`w-full rounded-lg py-1.5 text-center text-sm font-semibold transition-all ${
                                            active
                                              ? "bg-pink-400 text-white dark:bg-sky-400 dark:text-black"
                                              : "text-zinc-600 hover:bg-sky-100 dark:text-zinc-300 dark:hover:bg-white/10"
                                          }`}
                                        >
                                          {m}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="flex w-1/5 flex-col gap-1">
                                    {PERIOD_OPTIONS.map((p) => {
                                      const parts = parseTimeParts(formTime);
                                      const active = parts.period === p;
                                      return (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() =>
                                            setFormTime(`${to24Hour(parts.hour12, p)}:${parts.minute}`)
                                          }
                                          className={`rounded-lg py-1.5 text-center text-[11px] font-bold transition-all ${
                                            active
                                              ? "bg-pink-400 text-white dark:bg-sky-400 dark:text-black"
                                              : "text-zinc-600 hover:bg-sky-100 dark:text-zinc-300 dark:hover:bg-white/10"
                                          }`}
                                        >
                                          {p}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                {formTime && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormTime("");
                                      setShowTimePicker(false);
                                    }}
                                    className="mt-1.5 w-full rounded-full py-1 text-[10px] font-bold text-pink-500 hover:bg-pink-50 dark:text-sky-300 dark:hover:bg-white/5"
                                  >
                                    გასუფთავება
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {(Object.keys(TYPE_STYLE) as SyllabusMilestoneType[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormType(t)}
                            className={`flex-1 rounded-full px-2 py-1.5 text-[10px] font-bold transition-all ${
                              formType === t
                                ? "bg-pink-400 text-white dark:bg-sky-400 dark:text-black"
                                : "border border-sky-200 text-sky-600 dark:border-white/10 dark:text-zinc-400"
                            }`}
                          >
                            {TYPE_STYLE[t].label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="დამატებითი დეტალები (არასავალდებულო)"
                        rows={2}
                        className="w-full resize-none rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-pink-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500"
                      />
                      <div className="flex gap-2">
                        {editingId && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEvent(editingId)}
                            className="rounded-full border border-pink-200 px-4 py-2.5 text-xs font-bold text-pink-500 transition-all hover:bg-pink-50 dark:border-white/10 dark:text-pink-300 dark:hover:bg-white/5"
                          >
                            წაშლა
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSubmitEvent}
                          disabled={!formTitle.trim() || !formDate}
                          className="flex-1 rounded-full bg-pink-400 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-pink-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-sky-400 dark:text-black dark:hover:bg-sky-300"
                        >
                          {editingId ? "შენახვა" : "დამატება"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-[28px] border border-pink-200 bg-pink-50 p-5 dark:border-2 dark:border-pink-400/20 dark:bg-[#121214]">
              <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-white">
                {isViewingToday ? "დღევანდელი განრიგი" : "განრიგი"}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  ამ დღეს დაგეგმილი ღონისძიება არ არის.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedEvents.map((event) => {
                    const style = TYPE_STYLE[event.type];
                    const Icon = style.icon;
                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditForm(event)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") openEditForm(event);
                        }}
                        className="group flex w-full items-start gap-2.5 rounded-2xl p-1.5 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}
                        >
                          <Icon className="h-3.5 w-3.5 stroke-[1.75]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {event.title}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                            {style.label}
                            {event.time ? ` · ${formatTimeLabel(event.time)}` : ""}
                          </p>
                          {event.description && (
                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEvent(event.id);
                          }}
                          aria-label="წაშლა"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-300 opacity-0 transition-all hover:bg-black/5 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.aside>
  );
}
