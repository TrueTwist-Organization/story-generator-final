import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBase64ImageUrl(b64: string | undefined): string {
  if (!b64) return "";
  return b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
}

export function getBase64AudioUrl(b64: string | undefined, format: string = "mp3"): string {
  if (!b64) return "";
  return b64.startsWith("data:") ? b64 : `data:audio/${format};base64,${b64}`;
}
