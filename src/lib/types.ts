export type Role = "founder" | "admin" | "early_adopter" | "contributor" | "writer" | "inner_circle";

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
  is_hidden: boolean;
  visibility: "public" | "inner_circle";
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Author;
}

export const ROLE_LABELS: Record<Role, string> = {
  founder: "Founder",
  admin: "Admin",
  early_adopter: "Early Adopter",
  contributor: "Contributor",
  writer: "Writer",
  inner_circle: "Inner Circle",
};

export const ROLE_KAOMOJI: Record<Role, string> = {
  founder: "(*´▽`*)",
  early_adopter: "(◕‿◕)",
  contributor: "(｡◕‿◕｡)",
  writer: "(￣▽￣)",
  inner_circle: "(★‿★)",
};
