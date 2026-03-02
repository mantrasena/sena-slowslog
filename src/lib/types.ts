export type Role = "founder" | "early_contributor" | "contributor";

export interface Author {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: Role;
  bio: string;
  joinedDate: string;
  storyCount: number;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  author: Author;
  publishedAt: string;
  views: number;
  pinned?: boolean;
  isDraft?: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  founder: "Founder",
  early_contributor: "Early Contributor",
  contributor: "Contributor",
};

export const ROLE_EMOJI: Record<Role, string> = {
  founder: "👑",
  early_contributor: "🌟",
  contributor: "✍️",
};
