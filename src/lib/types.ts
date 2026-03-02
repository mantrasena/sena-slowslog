export type Role = "founder" | "early_contributor" | "contributor" | "writer";

export interface Author {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  role: Role;
  bio: string;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  is_draft: boolean;
  is_pinned: boolean;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Author;
}

export const ROLE_LABELS: Record<Role, string> = {
  founder: "Founder",
  early_contributor: "Early Contributor",
  contributor: "Contributor",
  writer: "Writer",
};

export const ROLE_KAOMOJI: Record<Role, string> = {
  founder: "(*´▽`*)",
  early_contributor: "(◕‿◕)",
  contributor: "(｡◕‿◕｡)",
  writer: "(￣▽￣)",
};
