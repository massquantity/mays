import * as React from 'react';
import { ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/input';
import { ChatHandler } from '@/lib/types';
import FileUploader from '@/components/file-uploader';
import { cn } from '@/lib/utils';

export default function ChatInput(
  props: Pick<ChatHandler, 'isLoading' | 'input' | 'handleSubmit' | 'handleInputChange'>
) {
  return (
    <form
      onSubmit={props.handleSubmit}
      className="animate-in fixed inset-x-0 bottom-8 w-full duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]"
    >
      <div className="mx-auto flex gap-2 rounded-full bg-gray-200 sm:max-w-4xl sm:p-4">
        <Input
          autoFocus
          name="message"
          placeholder="Send messages or upload files(txt, pdf, docx)..."
          className="flex-1"
          value={props.input}
          onChange={props.handleInputChange}
        />
        <FileUploader />
        <Button
          type="submit"
          variant="secondary"
          size="icon"
          className={cn(
            'bg-slate-100 rounded-full',
            props.input && 'bg-stone-800/80 text-white'
          )}
          disabled={props.isLoading}
        >
          <ArrowUp />
        </Button>
      </div>
    </form>
  );
}
