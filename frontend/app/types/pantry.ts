export type PantryItem = {
  id: number;
  name: string;
  emoji?: string;
  expiry: Date | null;
  addedAt?: Date;
};
