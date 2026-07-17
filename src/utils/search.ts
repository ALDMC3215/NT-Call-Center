export function normalizeSearchText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      // Convert Arabic letters to Persian
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      // Convert Persian/Arabic numbers to English
      .replace(/[۰-۹]/g, (d) => '0123456789'[d.charCodeAt(0) - 1776])
      .replace(/[٠-٩]/g, (d) => '0123456789'[d.charCodeAt(0) - 1632]);
}

export function matchesSearch(item: any, query: string): boolean {
    if (!query) return true;

    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;

    const searchableFields = [
        item.phone,
        item.fullName,
        item.interestedCourse,
        item.callStatus,
        item.registered,
        item.advisory,
        item.notes
    ];

    return searchableFields.some(field => {
        if (!field) return false;
        const normalizedField = normalizeSearchText(String(field));
        return normalizedField.includes(normalizedQuery);
    });
}
