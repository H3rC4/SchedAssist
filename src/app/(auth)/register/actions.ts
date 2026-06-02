'use server';

import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const language = formData.get('language') as string || 'es';

  if (!email || !password || !clinicName) {
    return { error: 'Please complete all fields.' };
  }

  // Call our custom registration endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    return { error: errorData.error || 'Error creating account.' };
  }

  const data = await response.json();
  return { success: true, message: data.message };
}
