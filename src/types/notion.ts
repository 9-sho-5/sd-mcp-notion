export type CreateOrUpdateBody = {
  databaseId?: string;
  title: string;
  slug?: string;
  properties?: Record<string, unknown>;
  children?: any[];
};
