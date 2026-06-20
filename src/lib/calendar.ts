// Turn a dated note into a calendar event the phone can add.
// Primary: an .ics file (Apple Calendar opens it natively on iPhone; Google can
// import it). Also exposes a Google Calendar "template" URL as an alternative.

function fmt(d: Date): string {
  // → 20260620T130000Z
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildICS(title: string, startISO: string, durationMin = 30): string {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMin * 60000);
  const uid = `${(crypto as Crypto).randomUUID?.() ?? Date.now()}@notaty`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Notaty//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(title)}`,
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function googleCalendarUrl(title: string, startISO: string, durationMin = 30): string {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMin * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Add to the iPhone Reminders app via the user's "Notaty Reminder" Shortcut.
 * Reminders has no web standard, so a Shortcut is the only route. We pass the
 * note text (which already contains the Arabic time) as the Shortcut input.
 */
export function addToReminders(title: string): void {
  const url =
    'shortcuts://run-shortcut?name=' +
    encodeURIComponent('Notaty Reminder') +
    '&input=text&text=' +
    encodeURIComponent(title);
  window.location.href = url;
}

/** Trigger the device "Add to Calendar" flow via a downloadable .ics. */
export function addToCalendar(title: string, startISO: string): void {
  const ics = buildICS(title, startISO);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notaty-reminder.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}
