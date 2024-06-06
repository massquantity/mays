'use server';

import { revalidatePath } from 'next/cache';

export async function cleanCache(path: string) {
  revalidatePath(path);
}
