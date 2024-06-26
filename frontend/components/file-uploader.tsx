import * as React from 'react';
import { LoaderCircle, Paperclip } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { toast } from 'react-hot-toast';

import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, fetchWIthTimeout } from '@/lib/utils';

const INPUT_ID = 'uploadFileInput';
const FILE_SIZE_LIMIT = 1024 * 1024 * 100; // 100MB

export default function FileUploader() {
  const [uploading, setUploading] = useState<boolean>(false);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await handleUpload(file);
    resetInput();
    setUploading(false);
    toast.success('Upload success!');
  };

  const handleUpload = async (file: File) => {
    if (file.size > FILE_SIZE_LIMIT) {
      toast.error(`File size exceeded. Limit is ${FILE_SIZE_LIMIT / 1024 / 1024} MB.`);
      throw new Error(`Failed to upload file`);
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
    await onUploadContent(base64, file.name);
  };

  const onUploadContent = async (content: string, fileName: string) => {
    // retrieve only the Base64 encoded string
    // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
    const base64 = content.split(',')[1];
    const response = await fetchWIthTimeout('http://localhost:8000/api/indexing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        content: base64,
        isBase64: true,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to upload file ${fileName}`);
    }
  };

  const resetInput = () => {
    const fileInput = document.getElementById(INPUT_ID) as HTMLInputElement;
    fileInput.value = '';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="self-stretch">
          <input
            type="file"
            id={INPUT_ID}
            style={{ display: 'none' }}
            onChange={onFileChange}
            disabled={uploading}
          />
          <label
            htmlFor={INPUT_ID}
            className={cn(
              buttonVariants({ variant: 'secondary', size: 'icon' }),
              'cursor-pointer bg-purple-200/90 text-foreground hover:bg-pink-200 dark:bg-background dark:text-foreground',
              uploading && 'opacity-50'
            )}
          >
            {uploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4 -rotate-45" />
            )}
          </label>
        </div>
      </TooltipTrigger>
      <TooltipContent>Upload file</TooltipContent>
    </Tooltip>
  );
}
