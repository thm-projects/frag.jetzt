export const prettyPrintDate = (
  inputDate: Date | null | undefined,
  language: string,
): string => {
  const date = new Date(inputDate);
  const dateString = date.toLocaleDateString(language ?? undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeString = date.toLocaleTimeString(language ?? undefined, {
    minute: '2-digit',
    hour: '2-digit',
  });
  return dateString + ' ' + timeString;
};
