export function monthKey(date = new Date()): string {
  return date.toLocaleDateString("en-CA").slice(0, 7);
}

export function monthLabel(month: string): string {
  const [year, value] = month.split("-").map(Number);
  if (!year || !value) return month;
  return new Date(year, value - 1, 1).toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  });
}

export function money(value: number): string {
  return `${Math.round(value).toLocaleString("ar-EG")} ج.م`;
}

export function percent(score: number, max: number): number {
  if (!max) return 0;
  return Math.round((score / max) * 100);
}

export function waPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  if (digits.length === 10) return `20${digits}`;
  return digits;
}

export function waLink(phone: string, text: string): string {
  const target = waPhone(phone);
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
