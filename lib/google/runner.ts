// Runs Google-prep code through the existing runner. We pre-inject the
// auto-test ourselves and pass a problem key the NeetCode runner doesn't
// know, so it adds nothing of its own — lib/code-runner.ts stays untouched.

import { runCode } from '@/lib/code-runner';
import type { Language } from '@/lib/types';
import { getGoogleTestInjection } from './starter';

export async function runGoogleCode(code: string, lang: Language, problemName: string): Promise<string> {
  const injected = code + getGoogleTestInjection(code, lang, problemName);
  return runCode(injected, lang, '__google_prep__');
}
