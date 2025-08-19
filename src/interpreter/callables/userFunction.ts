import { Stmt } from "../../ast";
import { Interpreter } from "../../interpreter";
import { Callable } from "../callable";
import { Environment } from "../environment";
import { ReturnSignal } from "../returnSignal";

export class UserFunction implements Callable {
  constructor(
    private readonly declaration: Stmt & { kind: "fn" },
    private readonly closure: Environment
  ) {}
  arity() {
    return this.declaration.params.length;
  }
  call(interpreter: Interpreter, args: any[]) {
    const env = new Environment(this.closure);
    this.declaration.params.forEach((p, i) => env.define(p.lexeme, args[i]));
    try {
      interpreter.executeBlock(this.declaration.body, env);
    } catch (ret) {
      if (ret instanceof ReturnSignal) return ret.value;
      throw ret;
    }
    return null;
  }
  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
