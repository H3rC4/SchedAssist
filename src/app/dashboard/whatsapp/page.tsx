'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function WhatsAppRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/settings/whatsapp');
  }, [router]);

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
