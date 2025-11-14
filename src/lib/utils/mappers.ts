/**
 * Common data transformation mappers
 */

export const dateFormatter = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const dateTimeFormatter = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString();
};

// Helper to check if something is date-like
function isDateLike(value: any): value is Date | string {
  return value instanceof Date || typeof value === 'string';
}

export const booleanFormatter = (value: boolean | number | string): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return false;
};

export const stringTruncate = (str: string | null | undefined, maxLength: number = 50): string => {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

/**
 * Generic mapper for database entities with timestamps
 */
export const baseEntityMapper = <T extends Record<string, any>>(
  entity: T,
  options: {
    formatDate?: boolean;
    formatDateTime?: boolean;
    excludeFields?: string[];
  } = {}
): Partial<T> => {
  const { formatDate = true, formatDateTime = false, excludeFields = [] } = options;

  const result: Partial<T> = { ...entity };

  // Remove excluded fields
  excludeFields.forEach(field => delete result[field]);

  // Format dates
  if (formatDate) {
    Object.keys(result).forEach(key => {
      const value = result[key];
      if (value && (key.includes('At') || key.includes('Date')) && isDateLike(value)) {
        (result as any)[key] = dateFormatter(value);
      }
    });
  }

  // Format datetime
  if (formatDateTime) {
    Object.keys(result).forEach(key => {
      const value = result[key];
      if (value && (key.includes('At') || key.includes('Date')) && isDateLike(value)) {
        (result as any)[key] = dateTimeFormatter(value);
      }
    });
  }

  return result;
};