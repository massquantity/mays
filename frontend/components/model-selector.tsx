'use client';

import React from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_EMBED_MODELS, ALL_LLM_MODELS } from '@/lib/constant';
import { useParamStore } from '@/lib/param-store';

export default function ModelSelector() {
  const [selectedLLM, setSelectedLLM] = React.useState('');
  const [selectedEmbed, setSelectedEmbed] = React.useState('');
  const { saveLlm, saveEmbedModel } = useParamStore((state) => state);

  React.useEffect(() => {
    if (selectedLLM) {
      saveLlm(selectedLLM);
    }
  }, [selectedLLM, saveLlm]);

  React.useEffect(() => {
    if (selectedEmbed) {
      saveEmbedModel(selectedEmbed);
    }
  }, [selectedEmbed, saveEmbedModel]);

  return (
    <div className="flex flex-col space-y-2">
      <Label className="pl-0.5 text-base font-semibold" htmlFor="model">
        LLM & Embed model
      </Label>
      <Select value={selectedLLM} onValueChange={setSelectedLLM}>
        <SelectTrigger className="space-x-4 font-normal lg:max-w-[250px] xl:max-w-[300px] 2xl:max-w-[400px]">
          <SelectValue placeholder="Select a LLM model" />
        </SelectTrigger>
        <SelectContent>
          {ALL_LLM_MODELS.map((model, i) => (
            <SelectItem key={i} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedEmbed} onValueChange={setSelectedEmbed}>
        <SelectTrigger className="space-x-4 font-normal lg:max-w-[250px] xl:max-w-[300px] 2xl:max-w-[400px]">
          <SelectValue placeholder="Select an embed model" />
        </SelectTrigger>
        <SelectContent>
          {ALL_EMBED_MODELS.map((model, i) => (
            <SelectItem key={i} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
