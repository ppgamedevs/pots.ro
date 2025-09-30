<<<<<<< HEAD
import { randomBytes } from "crypto";

export function generateId(length: number = 15): string {
  return randomBytes(length).toString("base64url");
=======
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
>>>>>>> main
}
