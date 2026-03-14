export type Recipe = {
  id: number;
  title: string;
  subtitle: string;
  tags: string[];
  color: string; // Tailwind gradient classes for placeholder hero
  emoji: string;
  ingredients: string[];
  instructions: string[];
};
