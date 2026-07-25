import { type Job, type ContentType } from "@/lib/api";

export interface ContentViewerProps {
  job: Job;
  onClose: () => void;
}

export interface TabContentProps {
  body: string;
  isEditing: boolean;
  editableRef: React.RefObject<HTMLDivElement>;
}

export const TABS: { key: ContentType; label: string; icon: string }[] = [
  { key: "TWITTER_THREAD", label: "Thread",     icon: "𝕏" },
  { key: "BLOG_POST",      label: "Blog",        icon: "✍" },
  { key: "FACEBOOK_POST",  label: "Facebook",    icon: "f" },
  { key: "HIGHLIGHTS",     label: "Highlights",  icon: "★" },
];