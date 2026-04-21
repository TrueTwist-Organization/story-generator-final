import { create } from 'zustand';
import type { StoryResponse, GenerateStoryBodyLanguage } from "@workspace/api-client-react";

interface StoryStore {
  activeStory: StoryResponse | null;
  voice: string;
  language: GenerateStoryBodyLanguage;
  faceImage: string | null;
  setActiveStory: (story: StoryResponse) => void;
  setVoice: (voice: string) => void;
  setLanguage: (lang: GenerateStoryBodyLanguage) => void;
  setFaceImage: (img: string | null) => void;
  clearActiveStory: () => void;
}

export const useStoryStore = create<StoryStore>((set) => ({
  activeStory: null,
  voice: 'shimmer',
  language: 'english',
  faceImage: null,
  setActiveStory: (story) => set({ activeStory: story }),
  setVoice: (voice) => set({ voice }),
  setLanguage: (language) => set({ language }),
  setFaceImage: (faceImage) => set({ faceImage }),
  clearActiveStory: () => set({ activeStory: null }),
}));

