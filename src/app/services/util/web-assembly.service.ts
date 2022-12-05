import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { Pointer, WasmExports, WasmUtils } from 'app/utils/wasm-utils';

interface OwnExports extends WasmExports {
  calculateWordCloudPlacing: (array: any) => void;
  Float32Array_ID: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebAssemblyService {
  private initialized = false;
  private isInitializing = false;
  private instance: WebAssembly.Instance;
  private exports: OwnExports;

  constructor() {}

  getWordCloudPlacing(data: number[]): Observable<number[]> {
    return this.instantiate().pipe(
      map(() => {
        const t = this.createWasmFloat32Array(data);
        const start = performance.now();
        this.exports.calculateWordCloudPlacing(t);
        console.info('[WASM] Needed time: ', performance.now() - start);
        const result = WasmUtils.getLowerTypedWasmData(
          t,
          Float32Array,
          2,
          this.exports.memory,
        );
        this.exports.__collect();
        return result;
      }),
    );
  }

  private createWasmFloat32Array(numbers: number[]): Pointer {
    return WasmUtils.createLowerTypedWasmArray(
      this.exports,
      this.exports.memory,
      Float32Array,
      this.exports.Float32Array_ID,
      2,
      numbers,
    );
  }

  private instantiate(): Observable<void> {
    return new Observable((subsriber) => {
      if (this.isInitializing || this.initialized) {
        subsriber.next();
        subsriber.complete();
        return;
      }
      this.isInitializing = true;
      let memory: WebAssembly.Memory = null;
      const imports = {
        env: {
          abort(
            message: Pointer,
            fileName: Pointer,
            lineNumber: number,
            columnNumber: number,
          ) {
            const msg = WasmUtils.stringFromPointer(memory, message >>> 0);
            const file = WasmUtils.stringFromPointer(memory, fileName >>> 0);
            lineNumber = lineNumber >>> 0;
            columnNumber = columnNumber >>> 0;
            (() => {
              // @external.js
              throw Error(`${msg} in ${file}:${lineNumber}:${columnNumber}`);
            })();
          },
          debugLog(message: Pointer) {
            const msg = WasmUtils.stringFromPointer(memory, message >>> 0);
            console.log('WASM: ' + msg);
          },
        },
      };
      this.compile()
        .pipe(
          switchMap((module) => from(WebAssembly.instantiate(module, imports))),
        )
        .subscribe({
          next: (instance) => {
            this.instance = instance;
            this.exports = instance.exports as unknown as OwnExports;
            memory = this.exports.memory;
            this.initialized = true;
            this.isInitializing = false;
            subsriber.next();
            subsriber.complete();
          },
          error: (err) => {
            this.isInitializing = false;
            subsriber.error(err);
          },
        });
    });
  }

  private compile(): Observable<WebAssembly.Module> {
    return new Observable((subscriber) => {
      const request = fetch('/assets/wasm/release.wasm');
      let promise: Promise<WebAssembly.Module>;
      if (WebAssembly.compileStreaming) {
        promise = WebAssembly.compileStreaming(request);
      } else {
        promise = request
          .then((data) => data.arrayBuffer())
          .then((buffer) => WebAssembly.compile(buffer));
      }
      promise.then(
        (f) => {
          subscriber.next(f);
          subscriber.complete();
        },
        (r) => {
          subscriber.error(r);
        },
      );
    });
  }
}
