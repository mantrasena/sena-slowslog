export interface Achievement {
  id: string;
  title: string;
  description: string;
  kaomoji: string;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  storyCount: number;
  totalViews: number;
  bookmarkCount: number;
  hasBio: boolean;
  joinedAt: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_story",
    title: "First Steps",
    description: "Published your first story",
    kaomoji: "✍️",
    check: (s) => s.storyCount >= 1,
  },
  {
    id: "five_stories",
    title: "Getting Started",
    description: "Published 5 stories",
    kaomoji: "📝",
    check: (s) => s.storyCount >= 5,
  },
  {
    id: "ten_stories",
    title: "Consistent Writer",
    description: "Published 10 stories",
    kaomoji: "📚",
    check: (s) => s.storyCount >= 10,
  },
  {
    id: "twentyfive_stories",
    title: "Storyteller",
    description: "Published 25 stories",
    kaomoji: "🎭",
    check: (s) => s.storyCount >= 25,
  },
  {
    id: "fifty_stories",
    title: "Dedicated Author",
    description: "Published 50 stories",
    kaomoji: "🏆",
    check: (s) => s.storyCount >= 50,
  },
  {
    id: "hundred_views",
    title: "Getting Noticed",
    description: "Your articles reached 100 views",
    kaomoji: "👀",
    check: (s) => s.totalViews >= 100,
  },
  {
    id: "fivehundred_views",
    title: "Rising Star",
    description: "Your articles reached 500 views",
    kaomoji: "⭐",
    check: (s) => s.totalViews >= 500,
  },
  {
    id: "thousand_views",
    title: "Viral Voice",
    description: "Your articles reached 1,000 views",
    kaomoji: "🔥",
    check: (s) => s.totalViews >= 1000,
  },
  {
    id: "bookworm",
    title: "Bookworm",
    description: "Bookmarked 10 articles",
    kaomoji: "🔖",
    check: (s) => s.bookmarkCount >= 10,
  },
  {
    id: "profile_complete",
    title: "Identity",
    description: "Completed your bio",
    kaomoji: "🪪",
    check: (s) => s.hasBio,
  },
];

export const getUnlockedAchievements = (stats: UserStats): Achievement[] => {
  return ACHIEVEMENTS.filter((a) => a.check(stats));
};
