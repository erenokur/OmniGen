import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface Provider {
  id: string;
  name: string;
  type: 'ollama' | 'openai' | 'anthropic';
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

interface AIStore {
  messages: Message[];
  providers: Provider[];
  activeProviderId: string | null;
  isGenerating: boolean;
  
  addMessage: (message: Message) => void;
  updateLastMessage: (chunk: string) => void;
  replaceLastMessage: (content: string) => void; // Yeni eklendi!
  setIsGenerating: (status: boolean) => void;
  clearMessages(): void;
  setActiveProvider: (id: string) => void;
  addProvider: (provider: Provider) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      messages: [],
      providers: [], 
      activeProviderId: null, 
      isGenerating: false,

      addMessage: (message) => 
        set((state) => ({ messages: [...state.messages, message] })),
        
      updateLastMessage: (chunk) =>
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1].content += chunk;
          }
          return { messages: newMessages };
        }),

      // Bu fonksiyon hata mesajlarını veya "Bağlanıyor" yazılarını temizlemek için eklendi
      replaceLastMessage: (content) =>
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1].content = content;
          }
          return { messages: newMessages };
        }),

      setIsGenerating: (status) => set({ isGenerating: status }),
      clearMessages: () => set({ messages: [] }),
      setActiveProvider: (id) => set({ activeProviderId: id }),
      addProvider: (provider) => 
        set((state) => ({ providers: [...state.providers, provider], activeProviderId: provider.id })),
    }),
    {
      name: 'ai-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
