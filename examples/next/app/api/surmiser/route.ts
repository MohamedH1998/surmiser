import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const inputSchema = z.object({
  inputValue: z.string(),
  cursorPosition: z.number(),
  meta: z.record(z.string(), z.unknown()).optional(),
  prompt: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json();

  const parsedBody = inputSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { prompt } = parsedBody.data;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),

    schema: z.object({
      suggestion: z.string().optional().nullable(),
      confidence: z.number().min(0).max(1),
    }),
    prompt: prompt,
  });

  return NextResponse.json(object);
}
