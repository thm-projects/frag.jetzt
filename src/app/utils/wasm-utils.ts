export type Pointer = number;

export type WasmGlobal = WebAssembly.Global & number;

export interface WasmExports {
  __new: (byteCount: number, type: number) => WasmGlobal;
  __pin: (pointer: WasmGlobal | Pointer) => WasmGlobal;
  __unpin: (pointer: WasmGlobal | Pointer) => void;
  __collect: () => void;
  __rtti_base: WasmGlobal;
  memory: WebAssembly.Memory;
}

export class WasmUtils {
  static getLowerTypedWasmData(
    pointer: Pointer,
    constructor,
    align: number,
    memory: WebAssembly.Memory,
  ): any[] {
    if (pointer === 0) {
      return null;
    }
    const memoryU32 = new Uint32Array(memory.buffer);
    const byteCount = memoryU32[(pointer + 8) >>> 2];
    const offset = memoryU32[(pointer + 4) >>> 2];
    const length = byteCount >>> align;
    const data = new constructor(memory.buffer, offset, length);
    return Array.from(data);
  }

  static createLowerTypedWasmArray(
    exports: WasmExports,
    memory: WebAssembly.Memory,
    constructor,
    id: number,
    align: number,
    values: any[],
  ) {
    if (values == null) return 0;
    const length = values.length;
    const byteCount = length << align;
    const buffer = exports.__pin(exports.__new(byteCount, 0)) >>> 0;
    const header = exports.__new(12, id) >>> 0;
    const memoryU32 = new Uint32Array(memory.buffer);
    memoryU32[(header + 0) >>> 2] = buffer;
    memoryU32[(header + 4) >>> 2] = buffer;
    memoryU32[(header + 8) >>> 2] = byteCount;
    new constructor(memory.buffer, buffer, length).set(values);
    exports.__unpin(buffer);
    return header;
  }

  static stringFromPointer(
    memory: WebAssembly.Memory,
    pointer: Pointer,
  ): string {
    if (!pointer) return null;
    const end =
      (pointer + new Uint32Array(memory.buffer)[(pointer - 4) >>> 2]) >>> 1;
    const memoryU16 = new Uint16Array(memory.buffer);
    let start = pointer >>> 1,
      string = '';
    while (end - start > 1024)
      string += String.fromCharCode(
        ...memoryU16.subarray(start, (start += 1024)),
      );
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }

  static requireNonNull() {
    throw TypeError('value must not be null');
  }
}
