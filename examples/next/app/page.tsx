'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurmiser } from 'surmiser/react';

const RemoteEndpointCustomInput = () => {
  const { attachRef } = useSurmiser({
    providers: [
      {
        id: 'gemini-ai',
        endpoint: '/api/surmiser',
      },
    ],
    debounceMs: 350,
  });

  return (
    <section className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col gap-2 max-w-xl w-full p-4">
        <Label htmlFor="input">Example</Label>
        <Input
          id="input"
          ref={attachRef}
          placeholder="Type 'custom' or provider terms..."
          className="w-full p-3 border rounded"
        />
      </div>
    </section>
  );
};

export default RemoteEndpointCustomInput;
