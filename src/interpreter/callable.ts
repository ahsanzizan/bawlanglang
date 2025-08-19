import { Interpreter } from "../interpreter";

export interface Callable {
  arity(): number;
  call(interpreter: Interpreter, args: any[]): any;
  toString(): string;
}
