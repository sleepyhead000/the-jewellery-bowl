export const SEARCH_MIN_QUERY_LENGTH: number = 2;
export const SEARCH_MAX_RESULTS: number = 8;

export type SearchSuggestion = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  score?: number;
};

export type SearchResponse = {
  results: SearchSuggestion[];
};

export const normalizeSearchQuery = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

export const canSearchQuery = (value: string): boolean => {
  return normalizeSearchQuery(value).length >= SEARCH_MIN_QUERY_LENGTH;
};

