import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined, formatString: string = 'MMM d, yyyy'): string {
  if (!dateString) return 'Unknown Date';

  try {
    let _date: Date;
    if (typeof dateString === 'string') {
      // Replace SQLite ' ' with 'T' to fix Safari Mobile "Invalid Date" crashes
      const safeString = dateString.replace(' ', 'T');
      // If missing Z and it's a T string, it assumes local time natively, append Z to force UTC consistency if desired,
      // but standard SQLite DateTime without timezone is usually best parsed as local by appending Z or just T.
      _date = new Date(safeString.includes('Z') || !safeString.includes('T') ? safeString : safeString + 'Z');
    } else {
      _date = dateString;
    }

    // Fallback if still invalid
    if (isNaN(_date.getTime())) return 'Invalid Date';
    return format(_date, formatString);
  } catch (err) {
    return 'Invalid Date';
  }
}
