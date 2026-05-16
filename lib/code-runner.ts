import { PROBLEM_INFO } from './problems';

const JUDGE0_API = 'https://ce.judge0.com/submissions?wait=true';

const LANGUAGE_MAP: Record<string, number> = {
  python: 71,     // Python 3
  java: 62,       // OpenJDK 13
  cpp: 54,        // GCC 9.2.0
  javascript: 63, // Node.js 12.14.0
};

function getTestInjection(code: string, language: string, selectedProblem: string): string {
  const info = PROBLEM_INFO[selectedProblem];
  if (!info || !info.example) return '';

  const safeName = selectedProblem.replace(/[^a-zA-Z0-9]/g, '');
  const camelCase = safeName.charAt(0).toLowerCase() + safeName.slice(1);
  const snake_case = safeName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  
  const argsPart = info.example.split('->')[0].trim();
  const values = argsPart.split(',').map(s => {
    const parts = s.split('=');
    return parts.length > 1 ? parts[1].trim() : s.trim();
  }).join(', ');

  switch (language) {
    case 'javascript':
      if (code.includes('console.log')) return '';
      return `\n\n// --- Forge Auto-Test ---\nconsole.log("Input: ${argsPart}");\nconsole.log("Output:", ${camelCase}(${values}));`;
    
    case 'python':
      if (code.includes('print(')) return '';
      const pyMethod = code.includes('class Solution') 
        ? `Solution().${snake_case}(${values})` 
        : `${snake_case}(${values})`;
      return `\n\n# --- Forge Auto-Test ---\nprint(f"Input: ${argsPart}")\nprint(f"Output: {${pyMethod}}")`;
    
    case 'java':
      if (code.includes('System.out.println')) return '';
      return `
// --- Forge Auto-Test ---
class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("Input: ${argsPart}");
        System.out.println("Output: " + sol.${camelCase}(${values}));
    }
}
`;
    
    case 'cpp':
      if (code.includes('cout <<')) return '';
      return `
// --- Forge Auto-Test ---
#include <iostream>
int main() {
    Solution sol;
    std::cout << "Input: ${argsPart}" << std::endl;
    std::cout << "Output: " << sol.${camelCase}(${values}) << std::endl;
    return 0;
}
`;
    
    default:
      return '';
  }
}

async function runRemote(code: string, language: string, selectedProblem: string): Promise<string> {
  const languageId = LANGUAGE_MAP[language];
  if (!languageId) {
    return `❌ Unsupported language for remote execution: ${language}`;
  }

  let codeToExecute = code;
  const injection = getTestInjection(code, language, selectedProblem);
  codeToExecute += injection;

  // Add common headers for C++ if missing
  if (language === 'cpp' && !code.includes('#include')) {
    codeToExecute = `#include <bits/stdc++.h>\nusing namespace std;\n\n` + codeToExecute;
  }

  try {
    const response = await fetch(JUDGE0_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: codeToExecute,
        language_id: languageId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Judge0 API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Status handling
    if (data.status?.id > 3) { // 3 is Accepted, higher is error
      return `❌ ${data.status.description.toUpperCase()}:\n${data.stderr || data.compile_output || 'Unknown error'}`;
    }

    if (data.stderr) {
      return `❌ RUNTIME ERROR:\n${data.stderr}`;
    }

    if (data.compile_output) {
      return `❌ COMPILE ERROR:\n${data.compile_output}`;
    }

    return data.stdout || '✅ Execution complete (no output)';
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return `❌ REMOTE EXECUTION ERROR: ${errorMsg}`;
  }
}

export async function runCode(
  code: string,
  language: string,
  selectedProblem: string,
): Promise<string> {
  if (language !== 'javascript') {
    return runRemote(code, language, selectedProblem);
  }

  const logs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    originalLog(...args);
  };
  console.error = (...args) => {
    logs.push('❌ ERROR: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    originalError(...args);
  };

  try {
    let codeToExecute = code;
    const injection = getTestInjection(code, language, selectedProblem);
    codeToExecute += injection;

    const execute = new Function(codeToExecute);
    execute();
    return logs.join('\n') || '✅ Execution complete (no console.log output)';
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return logs.join('\n') + `\n❌ RUNTIME ERROR: ${errorMsg}`;
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}
