import { formatDistanceToNow } from "date-fns";

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPrice(price: number) {
  return `\u20B9${price.toLocaleString("en-IN")}`;
}

export function generatePseudonym(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "Student#";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
