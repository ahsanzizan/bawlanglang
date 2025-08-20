import { TokenType } from "./tokenType";

export class Token {
  constructor(
    public type: TokenType,
    public lexeme: string,
    public literal: any,
    public line: number,
    public col: number
  ) {}
  toString() {
    return `${TokenType[this.type]} ${this.lexeme} ${this.literal}`;
  }
}
