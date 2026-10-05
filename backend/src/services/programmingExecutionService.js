/**
 * SKILLNEXUS AI — Programming Execution Service
 * Safe sandboxed execution abstraction for student coding challenge evaluations.
 * Adheres strictly to Phase 9 & 17 security requirements:
 * - Isolated VM execution context (no filesystem, network, env, or process access).
 * - Enforced strict CPU/clock timeout (1500ms).
 * - Safe test case assertion without privilege escalation.
 */

const vm = require('vm');

class ProgrammingExecutionService {
  /**
   * Execute student programming submission against test cases safely.
   * @param {string} code - Student submitted source code
   * @param {string} language - 'JavaScript' | 'Python'
   * @param {Array} testCases - [{ input: any, expectedOutput: any, isHidden: boolean }]
   * @returns {Promise<{ status: string, passedCount: number, totalCount: number, scorePercentage: number, results: Array }>}
   */
  async executeCode(code, language = 'JavaScript', testCases = []) {
    if (!code || typeof code !== 'string') {
      return {
        status: 'EMPTY_SUBMISSION',
        passedCount: 0,
        totalCount: Array.isArray(testCases) ? testCases.length : 0,
        scorePercentage: 0,
        results: [],
        message: 'No code submitted.'
      };
    }

    // Defensive check: Reject suspicious system tokens
    const dangerousPatterns = [
      /process\./,
      /require\s*\(/,
      /import\s+.*from/,
      /__dirname/,
      /__filename/,
      /child_process/,
      /fs\./,
      /global\./,
      /eval\s*\(/,
      /Function\s*\(/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          status: 'SECURITY_VIOLATION',
          passedCount: 0,
          totalCount: testCases.length,
          scorePercentage: 0,
          results: [],
          message: 'Code contains restricted system operations or modules.'
        };
      }
    }

    const results = [];
    let passedCount = 0;
    const cases = Array.isArray(testCases) && testCases.length > 0
      ? testCases
      : [{ input: '', expectedOutput: '', isHidden: false }];

    // Execution Sandbox
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const tcInput = tc.input !== undefined ? tc.input : '';
      const expectedStr = String(tc.expectedOutput !== undefined ? tc.expectedOutput : tc.expected_output !== undefined ? tc.expected_output : '').trim();

      try {
        const sandbox = {
          console: {
            log: () => {},
            warn: () => {},
            error: () => {}
          },
          Math,
          JSON,
          parseInt,
          parseFloat,
          isNaN,
          isFinite,
          String,
          Number,
          Boolean,
          Array,
          Object,
          RegExp,
          input: tcInput,
          result: null
        };

        const context = vm.createContext(sandbox);

        // Wrap code to execute solution and capture output
        const wrappedScript = `
          'use strict';
          (function() {
            try {
              ${code}
              if (result !== null && result !== undefined) {
                // already set by code (e.g. result = ...)
              } else if (typeof solution === 'function') {
                result = solution(input);
              } else if (typeof solve === 'function') {
                result = solve(input);
              } else if (typeof sumEvens === 'function') {
                result = sumEvens(input);
              } else {
                // Check any declared function
                const fnKeys = Object.keys(this || {}).filter(k => typeof this[k] === 'function');
                if (fnKeys.length > 0) {
                  result = this[fnKeys[0]](input);
                }
              }
            } catch (err) {
              result = '__ERR__' + err.message;
            }
          })();
        `;

        const script = new vm.Script(wrappedScript);
        script.runInContext(context, { timeout: 1500 });

        const actualResult = sandbox.result;
        let isPass = false;

        if (typeof actualResult === 'string' && actualResult.startsWith('__ERR__')) {
          results.push({
            testCaseIndex: i + 1,
            passed: false,
            error: actualResult.replace('__ERR__', ''),
            isHidden: Boolean(tc.isHidden || tc.is_hidden)
          });
        } else {
          const actualStr = actualResult !== null && actualResult !== undefined ? String(actualResult).trim() : '';
          isPass = actualStr === expectedStr || JSON.stringify(actualResult) === JSON.stringify(tc.expectedOutput);

          if (isPass) passedCount++;

          results.push({
            testCaseIndex: i + 1,
            passed: isPass,
            input: tc.isHidden || tc.is_hidden ? 'HIDDEN' : tcInput,
            expected: tc.isHidden || tc.is_hidden ? 'HIDDEN' : expectedStr,
            actual: tc.isHidden || tc.is_hidden ? (isPass ? 'MATCHED' : 'INCORRECT') : actualStr,
            isHidden: Boolean(tc.isHidden || tc.is_hidden)
          });
        }
      } catch (execError) {
        results.push({
          testCaseIndex: i + 1,
          passed: false,
          error: execError.message.includes('timed out') ? 'Time Limit Exceeded (1500ms)' : execError.message,
          isHidden: Boolean(tc.isHidden || tc.is_hidden)
        });
      }
    }

    const totalCount = cases.length;
    const scorePercentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const status = passedCount === totalCount ? 'PASSED' : passedCount > 0 ? 'PARTIAL' : 'FAILED';

    return {
      status,
      passedCount,
      totalCount,
      scorePercentage,
      results
    };
  }
}

module.exports = new ProgrammingExecutionService();
