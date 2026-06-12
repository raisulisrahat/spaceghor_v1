/**
 * Formats a phone number input string according to the requirements:
 * 1. Allow up to 11 digits.
 * 2. If it starts with '+8801' or '8801', automatically convert/replace with '01'.
 * 3. Never support words (letters or non-digit characters, except allowing the initial '+' when typing +8801).
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits except a leading '+'
  let cleaned = value.replace(/(?!^\+)\D/g, '');

  // Handle +8801 and 8801 auto-conversion
  if (cleaned.startsWith('+8801')) {
    cleaned = '01' + cleaned.slice(5);
  } else if (cleaned.startsWith('8801')) {
    cleaned = '01' + cleaned.slice(4);
  }

  // Allow progressive typing of the +8801 prefix:
  // '+', '+8', '+88', '+880', '8', '88', '880'
  if (/^\+?8?8?0?$/.test(cleaned)) {
    return cleaned;
  }

  // Otherwise, strictly remove all non-digits (including the '+' if it didn't form a valid prefix)
  cleaned = cleaned.replace(/\D/g, '');

  // Limit to 11 digits
  if (cleaned.length > 11) {
    cleaned = cleaned.slice(0, 11);
  }

  return cleaned;
};

/**
 * Validates if the phone number is a valid 11-digit number starting with '01'.
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return phone.length === 11 && phone.startsWith('01') && /^\d+$/.test(phone);
};
