import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
}

export interface Sale {
  id: number;
  total: number;
  tax: number;
  discount: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}
