'use client';

import React from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useParamStore } from '@/lib/param-store';

export default function MaxTokensSelector() {
  const [value, setValue] = React.useState([2048]);
  const saveMaxTokens = useParamStore((state) => state.saveMaxTokens);

  React.useEffect(() => {
    if (value) {
      saveMaxTokens(value[0]);
    }
  }, [value, saveMaxTokens]);

  return (
    <div className="flex flex-col space-y-2 lg:max-w-[250px] xl:max-w-[400px]">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold" htmlFor="max-tokens">
              Max Tokens
            </Label>
            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
              {value}
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" side="left" className="w-64 text-sm">
          The maximum number of tokens that can be generated in the chat completion. The total
          length of input tokens and generated tokens is limited by the model's context length.
        </HoverCardContent>
      </HoverCard>
      <Slider
        id="top-p"
        defaultValue={value}
        min={1}
        max={8192}
        step={10}
        onValueChange={setValue}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        aria-label="Max Tokens"
      />
    </div>
  );
}
