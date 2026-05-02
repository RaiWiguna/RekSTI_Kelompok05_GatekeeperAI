export function getDayOfWeekFromDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  return weekday.toLowerCase() as
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
}
