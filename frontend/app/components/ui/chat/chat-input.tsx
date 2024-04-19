import * as React from 'react';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ChatHandler } from '@/app/components/ui/chat/chat.interface';
import FileUploader from '@/app/components/file-uploader';

export default function ChatInput(
  props: Pick<ChatHandler, 'isLoading' | 'input' | 'handleSubmit' | 'handleInputChange'>
) {
  return (
    <form onSubmit={props.handleSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow-xl">
      <div className="flex w-full items-start justify-between gap-4">
        <Input
          autoFocus
          name="message"
          placeholder="Send messages or upload files(txt, pdf, docx)..."
          className="flex-1"
          value={props.input}
          onChange={props.handleInputChange}
        />
        <FileUploader />
        <Button type="submit" disabled={props.isLoading}>
          Send messages
        </Button>
      </div>
    </form>
  );
}
