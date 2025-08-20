import { Interpreter } from "..";
import { Callable } from "../callable";

export class NativeFunction implements Callable {
  constructor(
    private readonly name: string,
    private readonly fn: (...args: any[]) => any,
    private readonly _arity: number | null = null
  ) {}
  arity(): number {
    return this._arity ?? this.fn.length;
  }
  call(_i: Interpreter, args: any[]) {
    return this.fn(...args);
  }
  toString() {
    return `<native ${this.name}>`;
  }
}
