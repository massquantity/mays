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
import { ALL_MODELS } from '@/lib/constant';
import { useParamStore } from '@/lib/param-store';

export default function ModelSelector() {
  const [selectedModel, setSelectedModel] = React.useState('');
  const saveModelName = useParamStore((state) => state.saveModelName);

  React.useEffect(() => {
    if (selectedModel) {
      saveModelName(selectedModel);
    }
  }, [selectedModel, saveModelName]);

  return (
    <div className="flex flex-col space-y-2">
      <Label className="pl-0.5 text-base font-semibold" htmlFor="model">
        Model
      </Label>
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="space-x-4 font-normal lg:max-w-[250px] xl:max-w-[300px] 2xl:max-w-[400px]">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {ALL_MODELS.map((model, i) => (
            <SelectItem key={i} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
