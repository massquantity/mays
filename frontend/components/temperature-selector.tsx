'use client';

import React from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useParamStore } from '@/lib/param-store';

export default function TemperatureSelector() {
  const [value, setValue] = React.useState([1.0]);
  const saveTemperature = useParamStore((state) => state.saveTemperature);

  React.useEffect(() => {
    if (value) {
      saveTemperature(value[0]);
    }
  }, [value, saveTemperature]);

  return (
    <div className="flex flex-col space-y-2 lg:max-w-[250px] xl:max-w-[400px]">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold" htmlFor="temperature">
              Temperature
            </Label>
            <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
              {value}
            </span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" side="left" className="w-64 text-sm">
          What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the
          output more random, while lower values like 0.2 will make it more focused and
          deterministic.
        </HoverCardContent>
      </HoverCard>
      <Slider
        id="temperature"
        defaultValue={value}
        min={0.0}
        max={2.0}
        step={0.1}
        onValueChange={setValue}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        aria-label="Temperature"
      />
    </div>
  );
}
