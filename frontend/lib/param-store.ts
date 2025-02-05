import { create } from 'zustand';

interface ParamState {
  llm: string;
  llmApiKey: string;
  embedModel: string;
  embedApiKey: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface ParamAction {
  saveLlm: (llm: string) => void;
  saveLlmApiKey: (llmApiKey: string) => void;
  saveEmbedModel: (embedModel: string) => void;
  saveEmbedApiKey: (embedApiKey: string) => void;
  removeApiKey: () => void;
  saveTemperature: (temperature: number) => void;
  saveMaxTokens: (maxTokens: number) => void;
  saveTopP: (topP: number) => void;
  getChatParams: () => {
    llm: string;
    apiKey: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

export const useParamStore = create<ParamState & ParamAction>()((set, get) => ({
  llm: '',
  llmApiKey: '',
  embedModel: '',
  embedApiKey: '',
  temperature: 1.0,
  maxTokens: 2048,
  topP: 1.0,
  saveLlm: (llm: string) => set({ llm }),
  saveLlmApiKey: (llmApiKey: string) => set({ llmApiKey }),
  saveEmbedModel: (embedModel: string) => set({ embedModel }),
  saveEmbedApiKey: (embedApiKey: string) => set({ embedApiKey }),
  removeApiKey: () => set({ llmApiKey: '', embedApiKey: '' }),
  saveTemperature: (temperature: number) => set({ temperature }),
  saveMaxTokens: (maxTokens: number) => set({ maxTokens }),
  saveTopP: (topP: number) => set({ topP }),
  getChatParams: () => {
    const params = get();
    return {
      llm: params.llm,
      apiKey: params.llmApiKey,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      topP: params.topP,
    };
  },
}));
