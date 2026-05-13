export function asDate(value: Date | string): Date {
  return new Date(value as string);
}

export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDay(a: Date | string, b: Date | string): boolean {
  const left = asDate(a);
  const right = asDate(b);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date: Date, firstDay = 1): Date {
  const next = stripTime(date);
  const diff = (next.getDay() - firstDay + 7) % 7;
  next.setDate(next.getDate() - diff);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function monthMatrix(date: Date): Date[] {
  const first = startOfWeek(startOfMonth(date), 1);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

export function weekDays(date: Date): Date[] {
  const first = startOfWeek(date, 1);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

export function monthTitle(date: Date): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

export function compactTime(value: Date | string): string {
  const date = asDate(value);
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

export function dayNumber(date: Date): string {
  return String(date.getDate());
}

export function weekdayShort(date: Date): string {
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date);
}

export function isoDateInput(value: Date | string): string {
  const date = asDate(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function timeInput(value: Date | string): string {
  const date = asDate(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function fromDateAndTime(dateValue: string, timeValue = '09:00'): Date {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function eventsForDay<T extends { start: Date | string; end?: Date | string }>(events: T[], date: Date): T[] {
  const day = stripTime(date).getTime();
  return events
    .filter((event) => {
      const start = stripTime(asDate(event.start)).getTime();
      const end = event.end ? stripTime(asDate(event.end)).getTime() : start;
      return day >= start && day <= end;
    })
    .sort((a, b) => asDate(a.start).getTime() - asDate(b.start).getTime());
}

export function weekNumber(day: Date): number {
  const date = stripTime(day);
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const weekOneStart = startOfWeek(firstThursday, 1);
  return Math.floor((date.getTime() - weekOneStart.getTime()) / 604800000) + 1;
}

export function viewLabel(view: string): string {
  if (view === 'timeGridDay') return 'Day';
  if (view === 'timeGridWeek') return 'Week';
  if (view === 'dayGridYear') return 'Year';
  return 'Month';
}
