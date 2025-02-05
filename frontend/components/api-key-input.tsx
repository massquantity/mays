'use client';

import React from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/input';
import { Label } from '@/components/ui/label';
import { useParamStore } from '@/lib/param-store';

export default function ApiKeyInput() {
  const [llmApiKey, setLlmApiKey] = React.useState('');
  const [embedApiKey, setEmbedApiKey] = React.useState('');
  const {
    llmApiKey: savedLlmKey,
    embedApiKey: savedEmbedKey,
    saveLlmApiKey,
    saveEmbedApiKey,
    removeApiKey,
  } = useParamStore((state) => state);

  const checkApiKeyExist = (llmKey?: string, embedKey?: string) => {
    if (!llmKey) {
      toast.error('No LLM api key found!');
      throw new Error('No LLM api key found!');
    }
    if (!embedKey) {
      toast.error('No embed api key found!');
      throw new Error('No embed api key found!');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    checkApiKeyExist(llmApiKey, embedApiKey);
    saveLlmApiKey(llmApiKey);
    saveEmbedApiKey(embedApiKey);
    toast.success('Set LLM and embed api key success!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLlmApiKey(e.target.value);
  };

  const handleDeleteKey = () => {
    checkApiKeyExist(savedLlmKey, savedEmbedKey);
    removeApiKey();
    setLlmApiKey('');
    setEmbedApiKey('');
    toast.success('Remove LLM and embed api key success!');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-2">
      <Label className="pl-0.5 text-base font-semibold" htmlFor="api-key">
        API Key
      </Label>
      <Input
        type="password"
        name="llm-api-key"
        id="llm-api-key"
        value={llmApiKey}
        placeholder="Enter your LLM api key..."
        className="rounded-md border-gray-300 dark:border-gray-700 xl:max-w-[400px]"
        onChange={handleInputChange}
      />
      <Input
        type="password"
        name="embed-api-key"
        id="embed-api-key"
        value={embedApiKey}
        placeholder="Enter your embed api key..."
        className="rounded-md border-gray-300 dark:border-gray-700 xl:max-w-[400px]"
        onChange={(e) => setEmbedApiKey(e.target.value)}
      />
      <div className="flex items-center justify-around">
        <Button type="submit" variant="default" size="sm">
          Submit
        </Button>
        <Button
          onClick={handleDeleteKey}
          disabled={!llmApiKey || !embedApiKey}
          variant="destructive"
          size="sm"
          type="button"
        >
          Remove
        </Button>
      </div>
    </form>
  );
}
