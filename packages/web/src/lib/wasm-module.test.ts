import { describe, expect, test } from 'vitest';
import { wasmModuleInput } from './wasm-module';

describe('WASM module initialization', () => {
  test('uses the single-object wasm-bindgen parameter shape', () => {
    expect(wasmModuleInput('/compiler.wasm')).toEqual({ module_or_path: '/compiler.wasm' });
  });
});
