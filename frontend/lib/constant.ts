export const CHAT_API = 'http://localhost:8000/api/rag';
export const IMAGE_API = 'http://localhost:8000/api/image';
export const INDEX_API = 'http://localhost:8000/api/indexing';

export const BINARY_EXTENSIONS = ['pdf', 'doc', 'docx'];
export const TEXT_EXTENSIONS = ['txt', 'md'];
export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ...BINARY_EXTENSIONS,
  ...TEXT_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
];

export const FILE_SIZE_LIMIT = 1024 * 1024 * 100; // 100MB
