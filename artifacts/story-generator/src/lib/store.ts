import { create } from 'zustand';
import type { StoryResponse } from '@workspace/api-client-react/src/generated/api.schemas';

interface StoryStore {
  activeStory: StoryResponse | null;
  setActiveStory: (story: StoryResponse) => void;
  clearActiveStory: () => void;
}

export const useStoryStore = create<StoryStore>((set) => ({
  activeStory: null,
  setActiveStory: (story) => set({ activeStory: story }),
  clearActiveStory: () => set({ activeStory: null }),
}));
