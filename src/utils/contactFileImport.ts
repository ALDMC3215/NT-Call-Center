import * as xlsx from 'xlsx';

export const normalizeIranianMobile = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  let str = String(value);

  // Convert Persian/Arabic numerals to ASCII
  str = str.replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x0660))
           .replace(/[\u06f0-\u06f9]/g, c => String(c.charCodeAt(0) - 0x06f0));

  // Remove spaces, hyphens, parentheses, dots, and plus signs
  str = str.replace(/[\s\-\(\)\.\+]/g, '');

  if (str.startsWith('0098')) {
    str = '0' + str.substring(4);
  } else if (str.startsWith('98') && str.length >= 11) {
    str = '0' + str.substring(2);
  } else if (str.length === 10 && str.startsWith('9')) {
    str = '0' + str;
  }

  if (/^09\d{9}$/.test(str)) {
    return str;
  }
  return null;
};

export type ParseContactsFileOptions = {
  isBlacklisted: (phone: string) => boolean;
};

export type ParsedContactsFileResult = {
  success: boolean;
  contacts: Array<{ phone: string; fullName: string }>;
  toAdd: Array<{ phone: string; fullName: string }>; // BACKWARDS COMPATIBILITY
  totalValid: number;
  duplicateCount: number;
  duplicatesInFile: number; // BACKWARDS COMPATIBILITY
  blacklistedCount: number;
  errorType?: 'unsupported-file' | 'unreadable-file' | 'no-valid-phone';
};

export const parseContactsFile = async (
  file: File,
  optionsOrFn: ParseContactsFileOptions | ((p: string) => boolean)
): Promise<ParsedContactsFileResult> => {
  const isBlacklisted = typeof optionsOrFn === 'function' ? optionsOrFn : optionsOrFn.isBlacklisted;

  // 1. Validate extension
  const fileName = file.name.toLowerCase();
  const isValidExt = fileName.endsWith('.xlsx') ||
                     fileName.endsWith('.xls') ||
                     fileName.endsWith('.xlsm') ||
                     fileName.endsWith('.csv');

  if (!isValidExt) {
    return {
      success: false,
      contacts: [],
      toAdd: [],
      totalValid: 0,
      duplicateCount: 0,
      duplicatesInFile: 0,
      blacklistedCount: 0,
      errorType: 'unsupported-file'
    };
  }

  // 2. Read bytes and parse workbook
  let workbook: xlsx.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = xlsx.read(buffer, {
      type: 'array',
      cellText: true,
      cellDates: false,
      raw: false,
      WTF: false
    });
  } catch (error) {
    console.error({
      feature: 'settings-contact-import',
      stage: 'read-workbook',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return {
      success: false,
      contacts: [],
      toAdd: [],
      totalValid: 0,
      duplicateCount: 0,
      duplicatesInFile: 0,
      blacklistedCount: 0,
      errorType: 'unreadable-file'
    };
  }

  // 3. Extract and normalize
  const rawContacts: Array<{ phone: string; fullName: string }> = [];
  const uniquePhones = new Set<string>();
  let duplicateCount = 0;

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });

    for (const row of rows) {
      if (!row || !Array.isArray(row)) continue;

      let phoneStr = '';
      let nameStr = '';

      for (const cellVal of row) {
        const rawString = String(cellVal || '');
        const normalized = normalizeIranianMobile(rawString);

        if (!phoneStr && normalized) {
          phoneStr = normalized;
        } else if (rawString.trim().length > 2 && !rawString.match(/\d/) && !nameStr) {
          nameStr = rawString.trim();
        }
      }

      if (phoneStr) {
         if (uniquePhones.has(phoneStr)) {
           duplicateCount++;
         } else {
           uniquePhones.add(phoneStr);
           rawContacts.push({ phone: phoneStr, fullName: nameStr || '' });
         }
      }
    }
  });

  if (uniquePhones.size === 0) {
    return {
      success: false,
      contacts: [],
      toAdd: [],
      totalValid: 0,
      duplicateCount: 0,
      duplicatesInFile: 0,
      blacklistedCount: 0,
      errorType: 'no-valid-phone'
    };
  }

  // 4. Apply blacklist after parsing
  const contacts: Array<{ phone: string; fullName: string }> = [];
  let blacklistedCount = 0;

  for (const contact of rawContacts) {
    if (isBlacklisted(contact.phone)) {
      blacklistedCount++;
    } else {
      contacts.push(contact);
    }
  }

  return {
    success: true,
    contacts,
    toAdd: contacts,
    totalValid: uniquePhones.size,
    duplicateCount,
    duplicatesInFile: duplicateCount,
    blacklistedCount
  };
};
