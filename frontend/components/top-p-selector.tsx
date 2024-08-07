'use client';

import React from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useParamStore } from '@/lib/param-store';

export default function TopPSelector() {
  const [value, setValue] = React.useState([1.0]);
  const saveTopP = useParamStore((state) => state.saveTopP);

  React.useEffect(() => {
    if (value) {
      saveTopP(value[0]);
    }
  }, [value, saveTopP]);

  return (
    <div className="flex flex-col space-y-2 lg:max-w-[250px] xl:max-w-[400px]">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold" htmlFor="top-p">
              Top P
            </Label>
            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
              {value}
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" side="left" className="w-64 text-sm">
          Control diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options
          are considered.
        </HoverCardContent>
      </HoverCard>
      <Slider
        id="top-p"
        defaultValue={value}
        min={0.1}
        max={1.0}
        step={0.1}
        onValueChange={setValue}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        aria-label="Top P"
      />
    </div>
  );
}
