export const CATEGORY_OPTIONS = [
  "AI",
  "Design",
  "Dev tools",
  "Education",
  "Finance",
  "Infrastructure",
  "Marketing",
  "Productivity",
  "Payments",
  "Shopping",
  "Social",
  "Video",
  "Other",
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export const CATEGORY_ICONS: Record<string, string> = {
  "AI": "✦",
  "Design": "✎",
  "Dev tools": "◈",
  "Education": "▲",
  "Finance": "◆",
  "Infrastructure": "☁",
  "Marketing": "◉",
  "Productivity": "⚡",
  "Payments": "▤",
  "Shopping": "◧",
  "Social": "◎",
  "Video": "▶",
  "Other": "■",
};
