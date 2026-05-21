import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const ACCEPTED_PICKUP_DATE_FORMATS = [
  'DD/MM/YYYY',
  'DD/MM/YYYY HH:mm',
  'YYYY-MM-DD',
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DDTHH:mm:ss',
];

export function parsePickupScheduledAt(value?: string | null) {
  if (value === undefined || value === null) {
    return value;
  }

  const rawDate = value.trim();
  const parsedDate = dayjs(rawDate, ACCEPTED_PICKUP_DATE_FORMATS, true);

  if (parsedDate.isValid()) {
    return parsedDate.toDate();
  }

  const isoDatePart = rawDate.match(/^(\d{4}-\d{2}-\d{2})T/);

  if (isoDatePart) {
    const [, date] = isoDatePart;

    if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      return null;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}/.test(rawDate)) {
    return null;
  }

  const isoDate = dayjs(rawDate);

  if (!isoDate.isValid()) {
    return null;
  }

  return isoDate.toDate();
}
