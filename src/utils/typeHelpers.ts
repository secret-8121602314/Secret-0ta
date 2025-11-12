import type { Json } from '../types/database';

/**
 * Safely converts a Json type to a Record<string, unknown>
 * Returns an empty object if the value is not a valid object
 */
export function jsonToRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

/**
 * Safely converts a Json type to a string
 * Returns an empty string if the value is not a string
 */
export function jsonToString(value: Json | null | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

/**
 * Safely converts a Json type to a number
 * Returns a default value if the value is not a number
 */
export function jsonToNumber(value: Json | null | undefined, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return value;
  }
  return defaultValue;
}

/**
 * Safely converts a Json type to a boolean
 * Returns a default value if the value is not a boolean
 */
export function jsonToBoolean(value: Json | null | undefined, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return defaultValue;
}

/**
 * Safely converts a Json type to an array
 * Returns an empty array if the value is not an array
 */
export function jsonToArray<T>(value: Json | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}

/**
 * Safely converts a value to Json type
 */
export function toJson(value: unknown): Json {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(toJson) as Json[];
  }
  
  if (typeof value === 'object') {
    const obj: { [key: string]: Json | undefined } = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        obj[key] = toJson((value as Record<string, unknown>)[key]);
      }
    }
    return obj;
  }
  
  return null;
}

/**
 * Safely handles nullable date strings
 */
export function safeParseDate(value: string | null | undefined, defaultValue: number = Date.now()): number {
  if (!value) {
    return defaultValue;
  }
  try {
    return new Date(value).getTime();
  } catch {
    return defaultValue;
  }
}

/**
 * Safely handles nullable strings
 */
export function safeString(value: string | null | undefined, defaultValue: string = ''): string {
  return value ?? defaultValue;
}

/**
 * Safely handles nullable numbers
 */
export function safeNumber(value: number | null | undefined, defaultValue: number = 0): number {
  return value ?? defaultValue;
}

/**
 * Safely handles nullable booleans
 */
export function safeBoolean(value: boolean | null | undefined, defaultValue: boolean = false): boolean {
  return value ?? defaultValue;
}
