import { type Job, type ContentType } from "@/src/lib/api";

export interface ContentViewerProps {
  job: Job;
  onClose: () => void;
}

export interface TabContentProps {
  body: string;
  isEditing: boolean;
  editableRef: React.RefObject<HTMLDivElement>;
}

/** Tab order, plate letters and riso inks match the specimens on the homepage. */
export const TABS: { key: ContentType; label: string; plate: string; ink: string }[] = [
  { key: "TWITTER_THREAD", label: "Thread", plate: "A", ink: "var(--fmt-thread)" },
  { key: "BLOG_POST", label: "Blog", plate: "B", ink: "var(--fmt-blog)" },
  { key: "FACEBOOK_POST", label: "Facebook", plate: "C", ink: "var(--fmt-social)" },
  { key: "HIGHLIGHTS", label: "Highlights", plate: "D", ink: "var(--fmt-marks)" },
];
