import { Token } from "../lexer";

export class Environment {
  private readonly values = new Map<string, any>();
  constructor(public enclosing?: Environment) {}
  define(name: string, value: any) {
    this.values.set(name, value);
  }
  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    if (!this.enclosing)
      throw new Error(`Undefined variable '${name.lexeme}'.`);

    this.enclosing.assign(name, value);
  }
  get(name: Token): any {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);
    if (this.enclosing) return this.enclosing.get(name);
    throw new Error(`Undefined variable '${name.lexeme}'.`);
  }
}
