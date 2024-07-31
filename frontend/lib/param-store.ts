import { create } from 'zustand';

interface ParamState {
  modelName: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface ParamAction {
  saveModelName: (modelName: string) => void;
  saveApiKey: (apiKey: string) => void;
  removeApiKey: () => void;
  saveTemperature: (temperature: number) => void;
  saveMaxTokens: (maxTokens: number) => void;
  saveTopP: (topP: number) => void;
  getAll: () => ParamState;
}

export const useParamStore = create<ParamState & ParamAction>()((set, get) => ({
  modelName: '',
  apiKey: '',
  temperature: 1.0,
  maxTokens: 2048,
  topP: 1.0,
  saveModelName: (modelName: string) => set({ modelName }),
  saveApiKey: (apiKey: string) => set({ apiKey }),
  removeApiKey: () => set({ apiKey: '' }),
  saveTemperature: (temperature: number) => set({ temperature }),
  saveMaxTokens: (maxTokens: number) => set({ maxTokens }),
  saveTopP: (topP: number) => set({ topP }),
  getAll: () => get(),
}));
