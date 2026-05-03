import { formatTimeString } from "./time";

const APP_TIME_ZONE = "Asia/Jakarta";

export function getCurrentJakartaDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export function combineDateAndTime(date: string, time: Date) {
  return `${date}T${formatTimeString(time)}+07:00`;
}
