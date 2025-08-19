import { Expr, Stmt } from "./ast";
import { Callable } from "./interpreter/callable";
import { NativeFunction } from "./interpreter/callables/nativeFunction";
import { UserFunction } from "./interpreter/callables/userFunction";
import { Environment } from "./interpreter/environment";
import { ReturnSignal } from "./interpreter/returnSignal";
import { Token, TokenType } from "./lexer";

class Interpreter {
  globals = new Environment();
  private env = this.globals;
  constructor(public output: (s: string) => void = console.log) {
    // built-ins
    this.globals.define(
      "clock",
      new NativeFunction("clock", () => Date.now() / 1000, 0)
    );
    this.globals.define(
      "print",
      new NativeFunction(
        "print",
        (x: any) => {
          this.output(this.stringify(x));
          return null;
        },
        1
      )
    );
  }

  interpret(statements: Stmt[]) {
    try {
      for (const s of statements) this.execute(s);
    } catch (e) {
      // TODO: handle error from interpreting statements
      throw e;
    }
  }

  private execute(stmt: Stmt) {
    switch (stmt.kind) {
      case "expr":
        this.evaluate(stmt.expression);
        break;
      case "print":
        const val = this.evaluate(stmt.expression);
        this.output(this.stringify(val));
        break;
      case "var":
        const init = stmt.initializer ? this.evaluate(stmt.initializer) : null;
        this.env.define(stmt.name.lexeme, init);
        break;
      case "block":
        this.executeBlock(stmt.statements, new Environment(this.env));
        break;
      case "if":
        if (this.isTruthy(this.evaluate(stmt.condition)))
          this.execute(stmt.thenBranch);
        else if (stmt.elseBranch) this.execute(stmt.elseBranch);
        break;
      case "while":
        while (this.isTruthy(this.evaluate(stmt.condition)))
          this.execute(stmt.body);
        break;
      case "fn":
        const func = new UserFunction(stmt, this.env);
        this.env.define(stmt.name.lexeme, func);
        break;
      case "return":
        throw new ReturnSignal(stmt.value ? this.evaluate(stmt.value) : null);
    }
  }

  executeBlock(statements: Stmt[], env: Environment) {
    const previous = this.env;
    try {
      this.env = env;
      for (const s of statements) this.execute(s);
    } finally {
      this.env = previous;
    }
  }

  private evaluate(expr: Expr): any {
    switch (expr.kind) {
      case "literal":
        return expr.value;
      case "group":
        return this.evaluate(expr.expression);
      case "variable":
        return this.env.get(expr.name);
      case "assign":
        const v = this.evaluate(expr.value);
        this.env.assign(expr.name, v);
        return v;
      case "unary":
        const r = this.evaluate(expr.right);
        switch (expr.operator.type) {
          case TokenType.MINUS:
            this.checkNumberOperand(expr.operator, r);
            return -Number(r);
          case TokenType.BANG:
            return !this.isTruthy(r);
          default:
            throw new Error("Invalid unary");
        }
      case "binary":
        return this.binary(expr);
      case "logical": {
        const left = this.evaluate(expr.left);
        if (expr.operator.type === TokenType.OR_OR) {
          if (this.isTruthy(left)) return left;
        } else if (!this.isTruthy(left)) return left;
        return this.evaluate(expr.right);
      }
      case "call":
        const callee = this.evaluate(expr.callee);
        const args = expr.args.map((a) => this.evaluate(a));
        if (!this.isCallable(callee))
          throw new Error("Can only call functions.");

        const fn = callee;
        if (args.length !== fn.arity())
          throw new Error(
            `Expected ${fn.arity()} args but got ${args.length}.`
          );
        return fn.call(this, args);
    }
  }

  private binary(expr: Extract<Expr, { kind: "binary" }>) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case TokenType.PLUS:
        return typeof left === "number" && typeof right === "number"
          ? left + right
          : String(left) + String(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(right) === 0
          ? (() => {
              throw new Error("Division by zero");
            })()
          : Number(left) / Number(right);
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      default:
        throw new Error("Unknown binary op");
    }
  }

  private isCallable(v: any): v is Callable {
    return v && typeof v.call === "function" && typeof v.arity === "function";
  }
  private isTruthy(v: any) {
    return v !== false && v !== null && v !== undefined;
  }
  private isEqual(a: any, b: any) {
    return a === b;
  }
  private checkNumberOperand(_op: Token, v: any) {
    if (typeof v === "number") return;
    throw new Error("Operand must be a number.");
  }
  private checkNumberOperands(_op: Token, a: any, b: any) {
    if (typeof a === "number" && typeof b === "number") return;
    throw new Error("Operands must be numbers.");
  }
  private stringify(v: any): string {
    if (v === null || v === undefined) return "nil";
    if (typeof v === "number") {
      let s = String(v);
      if (s.endsWith(".0")) s = s.slice(0, -2);
      return s;
    }
    return String(v);
  }
}

export { Interpreter };
