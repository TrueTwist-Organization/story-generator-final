import { create } from 'zustand';
import type { StoryResponse } from "@workspace/api-client-react";

interface StoryStore {
  activeStory: StoryResponse | null;
  voice: string;
  faceImage: string | null;
  setActiveStory: (story: StoryResponse) => void;
  setVoice: (voice: string) => void;
  setFaceImage: (img: string | null) => void;
  clearActiveStory: () => void;
}

export const useStoryStore = create<StoryStore>((set) => ({
  activeStory: null,
  voice: 'shimmer',
  faceImage: null,
  setActiveStory: (story) => set({ activeStory: story }),
  setVoice: (voice) => set({ voice }),
  setFaceImage: (faceImage) => set({ faceImage }),
  clearActiveStory: () => set({ activeStory: null }),
}));
