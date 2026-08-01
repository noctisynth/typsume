interface WasmBindgenModuleInput {
  module_or_path: string;
}

export function wasmModuleInput(moduleUrl: string): WasmBindgenModuleInput {
  return { module_or_path: moduleUrl };
}
