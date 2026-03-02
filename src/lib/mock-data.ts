import { Author, Story } from "./types";

export const currentUser: Author = {
  id: "1",
  name: "Mantra",
  username: "mantra",
  role: "founder",
  bio: "I build, but i write too.",
  joinedDate: "Nov 2025",
  storyCount: 3,
};

export const mockStories: Story[] = [
  {
    id: "1",
    title: "28 Februari 2026",
    subtitle: "Progress Platform",
    content: `<h2>Progress</h2>
<p>Ada fitur yang baru aja diupdate.</p>
<p>Dan beberapa fitur yang bugnya sangat banyak.</p>
<p>contoh simple: Enter dalam sebuah paragraf saja tidak bisa, harus enter 2x agar bisa kebawah baru bisa ter "enter"</p>
<p>Fitur: Floating Toolbar, jadi sekarang bisa <strong>Bold,</strong> <em>Italic</em> ataupun <u>Underline</u>, Tentu saja sebelumnya tidak bisa.</p>`,
    author: currentUser,
    publishedAt: "Feb 28",
    views: 19,
    pinned: true,
  },
  {
    id: "2",
    title: "Roadmap",
    subtitle: "Version 1.0",
    content: `<h2>What's coming</h2>
<p>A list of features we're building slowly, one step at a time.</p>
<p>No rush. Just words.</p>`,
    author: currentUser,
    publishedAt: "Feb 27",
    views: 63,
  },
  {
    id: "3",
    title: "22 November 2025",
    subtitle: "Pertama nulis blog",
    content: `<h2>First post</h2>
<p>This is where it all started. A simple thought, written down.</p>`,
    author: currentUser,
    publishedAt: "Nov 22",
    views: 250,
    pinned: true,
  },
];

export const mockDrafts: Story[] = [
  {
    id: "d1",
    title: "Untitled Draft",
    subtitle: "",
    content: "",
    author: currentUser,
    publishedAt: "",
    views: 0,
    isDraft: true,
  },
];
