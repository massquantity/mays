import * as React from 'react';
import { LoaderCircle, Paperclip } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { toast } from 'react-hot-toast';

import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  BINARY_EXTENSIONS,
  FILE_SIZE_LIMIT,
  IMAGE_API,
  IMAGE_EXTENSIONS,
  INDEX_API,
} from '@/lib/constant';
import { cn, fetchWIthTimeout } from '@/lib/utils';

const INPUT_ID = 'uploadFileInput';

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
      throw new Error(`File size exceeds the limit of ${FILE_SIZE_LIMIT / 1024 / 1024} MB.`);
    }

    const fileExtension = file.name.split('.').pop();
    if (!fileExtension) {
      toast.error(`Failed to get file extension from file ${file.name}.`);
      throw new Error('Failed to get file extension.');
    }
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(fileExtension)) {
      toast.error(`Unsupported file extension ${fileExtension}.`);
      throw new Error(`Unsupported file extension ${fileExtension}.`);
    }

    if (IMAGE_EXTENSIONS.includes(fileExtension)) {
      await onUploadImage(file);
    } else {
      await onUploadContent(file, fileExtension);
    }
  };

  const onUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    await fetchWIthTimeout(IMAGE_API, {
      method: 'POST',
      body: formData,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to upload file ${file.name}`);
      }
    });
  };

  const onUploadContent = async (file: File, fileExtension: string) => {
    const isBinary = BINARY_EXTENSIONS.includes(fileExtension);
    const reader = new FileReader();
    const content = await new Promise<string>((resolve, reject) => {
      if (isBinary) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

    await fetchWIthTimeout(INDEX_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        // retrieve only the Base64 encoded string
        // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        content: isBinary ? content.split(',').pop() : content,
        isBase64: isBinary,
      }),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to upload file ${file.name}`);
      }
    });
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
