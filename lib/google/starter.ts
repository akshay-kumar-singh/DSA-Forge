// ======================================================
// GOOGLE PREP — starter code & auto-test injection
// Mirrors lib/problems.ts getStarterCode / lib/code-runner.ts
// getTestInjection, but driven by GOOGLE_PROBLEMS so the
// existing NeetCode generator stays untouched. Design problems
// get a real class skeleton instead of a bare function.
// ======================================================

import type { Language } from '@/lib/types';
import type { GoogleProblem } from './types';
import { GOOGLE_PROBLEMS } from './problems';

function identifiers(name: string) {
  const safe = name.replace(/[^a-zA-Z0-9]/g, '');
  const camel = safe.charAt(0).toLowerCase() + safe.slice(1);
  const snake = safe.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`).replace(/^_/, '');
  return { safe, camel, snake };
}

/** "nums = [2,7], target = 9 -> [0,1]"  →  { argsPart: "nums = [2,7], target = 9", values: "[2,7], 9" } */
function exampleArgs(example: string) {
  const argsPart = example.split('->')[0].trim();
  const values = argsPart
    .split(',')
    .map(s => { const parts = s.split('='); return parts.length > 1 ? parts[1].trim() : s.trim(); })
    .join(', ');
  return { argsPart, values };
}

function designStarter(problem: GoogleProblem, lang: Language): string {
  const { cls, ctor, methods } = problem.design!;
  const ex = problem.example ? `\n * Example: ${problem.example}` : '';
  switch (lang) {
    case 'javascript':
      return `/**
 * Mission: ${problem.name}${ex}
 */
class ${cls} {
  constructor(${ctor.join(', ')}) {
    // Write your code here
  }
${methods.map(([m, ps]) => `
  ${m}(${ps.join(', ')}) {
    // Write your code here
  }`).join('\n')}
}

// Test your code:
// const obj = new ${cls}(${ctor.map(() => '/* arg */').join(', ')});
// console.log(obj.${methods[0]?.[0] ?? 'method'}(/* args */));`;
    case 'python':
      return `class ${cls}:
    def __init__(self${ctor.length ? ', ' + ctor.join(', ') : ''}):${problem.example ? `\n        # Example: ${problem.example}` : ''}
        # Write your code here
        pass
${methods.map(([m, ps]) => `
    def ${m}(self${ps.length ? ', ' + ps.join(', ') : ''}):
        # Write your code here
        pass`).join('\n')}`;
    case 'java':
      return `class ${cls} {
    public ${cls}(${ctor.map(c => `Object ${c}`).join(', ')}) {
        // Write your code here
    }
${methods.map(([m, ps]) => `
    public Object ${m}(${ps.map(x => `Object ${x}`).join(', ')}) {
        // Write your code here
        return null;
    }`).join('\n')}
}`;
    case 'cpp':
      return `class ${cls} {
public:
    ${cls}(${ctor.map(c => `auto ${c}`).join(', ')}) {
        // Write your code here
    }
${methods.map(([m, ps]) => `
    auto ${m}(${ps.map(x => `auto ${x}`).join(', ')}) {
        // Write your code here
    }`).join('\n')}
};`;
  }
}

export function getGoogleStarterCode(problemName: string, lang: Language): string {
  const info = GOOGLE_PROBLEMS[problemName];
  if (!info) return '// Write your code here';
  if (info.design) return designStarter(info, lang);

  const { camel, snake } = identifiers(problemName);
  const js = info.params.join(', ');
  const ex = info.example ? `\n * Example: ${info.example}` : '';
  const pyEx = info.example ? `\n        # Example: ${info.example}` : '';

  switch (lang) {
    case 'python':
      return `class Solution:
    def ${snake}(self, ${js}):${pyEx}
        # Write your code here
        pass`;
    case 'javascript': {
      const testCall = info.example
        ? `// console.log(${camel}(${exampleArgs(info.example).values}));`
        : `// console.log(${camel}(/* args */));`;
      return `/**
 * Mission: ${problemName}${ex}
 */
var ${camel} = function(${js}) {
    // Write your code here
};

// Test your code:
${testCall}`;
    }
    case 'java':
      return `class Solution {
    public Object ${camel}(${info.params.map(x => `Object ${x}`).join(', ')}) {
        // Write your code here
        return null;
    }
}`;
    case 'cpp':
      return `class Solution {
public:
    auto ${camel}(${info.params.map(x => `auto ${x}`).join(', ')}) {
        // Write your code here
    }
};`;
  }
}

/**
 * Auto-test snippet appended before running — same behaviour as the
 * NeetCode runner: only when the problem has an example and the user
 * hasn't already printed something. Design problems get no injection
 * (their examples are call sequences, not a single invocation).
 */
export function getGoogleTestInjection(code: string, lang: Language, problemName: string): string {
  const info = GOOGLE_PROBLEMS[problemName];
  if (!info || !info.example || info.design) return '';
  const { camel, snake } = identifiers(problemName);
  const { argsPart, values } = exampleArgs(info.example);
  const label = argsPart.replace(/"/g, '\\"');
  // The starter ships a commented-out test call; only a *live* print should suppress the auto-test.
  const live = lang === 'python' ? code.replace(/#.*$/gm, '') : code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  switch (lang) {
    case 'javascript':
      if (live.includes('console.log')) return '';
      return `\n\n// --- Forge Auto-Test ---\nconsole.log("Input: ${label}");\nconsole.log("Output:", ${camel}(${values}));`;
    case 'python': {
      if (live.includes('print(')) return '';
      const call = code.includes('class Solution') ? `Solution().${snake}(${values})` : `${snake}(${values})`;
      return `\n\n# --- Forge Auto-Test ---\nprint("Input: ${label}")\nprint("Output:", ${call})`;
    }
    case 'java':
      if (live.includes('System.out.println')) return '';
      return `
// --- Forge Auto-Test ---
class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("Input: ${label}");
        System.out.println("Output: " + sol.${camel}(${values}));
    }
}
`;
    case 'cpp':
      if (live.includes('cout <<')) return '';
      return `
// --- Forge Auto-Test ---
#include <iostream>
int main() {
    Solution sol;
    std::cout << "Input: ${label}" << std::endl;
    std::cout << "Output: " << sol.${camel}(${values}) << std::endl;
    return 0;
}
`;
  }
}
