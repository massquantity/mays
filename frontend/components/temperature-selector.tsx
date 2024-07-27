'use client';

import React from 'react';

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
  }, [value]);

  return (
    <div className="flex flex-col space-y-2 lg:max-w-[250px] xl:max-w-[400px]">
      <div className="flex justify-between">
        <Label className="text-base font-semibold" htmlFor="temperature">
          Temperature
        </Label>
        <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
          {value}
        </span>
      </div>
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
