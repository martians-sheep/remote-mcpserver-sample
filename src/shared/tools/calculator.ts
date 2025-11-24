/**
 * 計算機ツール
 * ローカル・リモート両方で使用する共通実装
 */

import { z } from 'zod';
import type { CalculatorOperation, CalculatorResult } from '../types/index.js';

export const CalculatorSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number(),
});

export function calculate(params: CalculatorOperation): CalculatorResult {
  const { operation, a, b } = params;

  let result: number;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) {
        throw new Error('Division by zero is not allowed');
      }
      result = a / b;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return {
    result,
    operation: `${a} ${operation} ${b} = ${result}`,
  };
}

export const calculatorToolDefinition = {
  name: 'calculator',
  description: 'Perform basic arithmetic operations (add, subtract, multiply, divide)',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The arithmetic operation to perform',
      },
      a: {
        type: 'number',
        description: 'The first number',
      },
      b: {
        type: 'number',
        description: 'The second number',
      },
    },
    required: ['operation', 'a', 'b'],
  },
};
