'use client';

import React from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/input';
import { Label } from '@/components/ui/label';
import { useParamStore } from '@/lib/param-store';

export default function ApiKeyInput() {
  const [apiKey, setApiKey] = React.useState('');
  const { saveApiKey, removeApiKey, apiKey: savedKey } = useParamStore((state) => state);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (apiKey) {
      saveApiKey(apiKey);
      toast.success('Set api key success!');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleDeleteKey = () => {
    if (savedKey !== '') {
      removeApiKey();
      setApiKey('');
      toast.success('Remove api key success!');
    } else {
      toast.error('No api key found!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-2">
      <Label className="pl-0.5 text-base font-semibold" htmlFor="api-key">
        API Key
      </Label>
      <Input
        type="password"
        name="api-key"
        id="api-key"
        value={apiKey}
        placeholder="Enter your api key..."
        className="rounded-md border-gray-300 dark:border-gray-700 xl:max-w-[400px]"
        onChange={handleInputChange}
      />
      <div className="flex items-center justify-around">
        <Button type="submit" variant="default" size="sm">
          Submit
        </Button>
        <Button
          onClick={handleDeleteKey}
          disabled={!apiKey}
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
