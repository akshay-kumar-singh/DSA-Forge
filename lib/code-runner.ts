import { PROBLEM_INFO } from './problems';

export function runCode(
  code: string,
  language: string,
  selectedProblem: string,
): string {
  if (language !== 'javascript') {
    return '⚠ Sandbox supports JavaScript only. For other languages, ask FORGE AI to dry-run it!';
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

    // Auto-inject test from example if no console.log present
    if (!code.includes('console.log')) {
      const info = PROBLEM_INFO[selectedProblem];
      if (info?.example) {
        const safeName = selectedProblem.replace(/[^a-zA-Z0-9]/g, '');
        const camelCase = safeName.charAt(0).toLowerCase() + safeName.slice(1);
        const argsPart = info.example.split('->')[0].trim();
        const values = argsPart.split(',').map(s => {
          const parts = s.split('=');
          return parts.length > 1 ? parts[1].trim() : s.trim();
        }).join(', ');
        codeToExecute += `\n\n// --- Forge Auto-Test ---\nconsole.log("Input: ${argsPart}");\nconsole.log("Output:", ${camelCase}(${values}));`;
      }
    }

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
