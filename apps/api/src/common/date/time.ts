export function parseTimeString(value: string) {
  return new Date(`1970-01-01T${value}.000Z`);
}

export function formatTimeString(value: Date) {
  return value.toISOString().slice(11, 19);
}
