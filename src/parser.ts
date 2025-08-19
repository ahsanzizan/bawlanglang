import { Expr, Stmt } from "./ast";
import { Token, TokenType } from "./lexer";

class ParseError extends Error {}

class Parser {
  private current = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) statements.push(this.declaration());
    return statements;
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.FN)) return this.fn("function");
      if (this.match(TokenType.LET)) return this.varDecl();
      return this.statement();
    } catch (e) {
      this.synchronize();
      if (e instanceof Error) throw e;
      else throw new Error("Parse error");
    }
  }

  private fn(_kind: string): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect function name.");
    this.consume(TokenType.LEFT_PAREN, "Expect '('.");
    const params: Token[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        params.push(
          this.consume(TokenType.IDENTIFIER, "Expect parameter name.")
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')'.");
    const body = this.blockStatements();
    return { kind: "fn", name, params, body };
  }

  private varDecl(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    let initializer: Expr | undefined;
    if (this.match(TokenType.EQUAL)) initializer = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return { kind: "var", name, initializer };
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) {
      const value = this.expression();
      this.consume(TokenType.SEMICOLON, "Expect ';'.");
      return { kind: "print", expression: value };
    }
    if (this.match(TokenType.RETURN)) {
      const keyword = this.previous();
      const value = this.check(TokenType.SEMICOLON)
        ? undefined
        : this.expression();
      this.consume(TokenType.SEMICOLON, "Expect ';' after return.");
      return { kind: "return", keyword, value };
    }
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE))
      return { kind: "block", statements: this.block() };
    return this.exprStatement();
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '('.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')'.");
    const thenBranch = {
      kind: "block",
      statements: this.blockStatements(),
    } as Stmt;
    let elseBranch: Stmt | undefined;
    if (this.match(TokenType.ELSE))
      elseBranch = { kind: "block", statements: this.blockStatements() };
    return { kind: "if", condition, thenBranch, elseBranch };
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '('.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')'.");
    const body = { kind: "block", statements: this.blockStatements() } as Stmt;
    return { kind: "while", condition, body };
  }

  private blockStatements(): Stmt[] {
    this.consume(TokenType.LEFT_BRACE, "Expect '{'.");
    const statements = this.block();
    return statements;
  }

  private block(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd())
      statements.push(this.declaration());
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private exprStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';'.");
    return { kind: "expr", expression: expr };
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();
    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();
      if (expr.kind === "variable")
        return { kind: "assign", name: expr.name, value };
      throw this.error(equals, "Invalid assignment target.");
    }
    return expr;
  }

  private or(): Expr {
    let expr = this.and();
    while (this.match(TokenType.OR_OR)) {
      const op = this.previous();
      const right = this.and();
      expr = { kind: "logical", left: expr, operator: op, right };
    }
    return expr;
  }
  private and(): Expr {
    let expr = this.equality();
    while (this.match(TokenType.AND_AND)) {
      const op = this.previous();
      const right = this.equality();
      expr = { kind: "logical", left: expr, operator: op, right };
    }
    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();
    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const op = this.previous();
      const right = this.comparison();
      expr = { kind: "binary", left: expr, operator: op, right };
    }
    return expr;
  }
  private comparison(): Expr {
    let expr = this.term();
    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const op = this.previous();
      const right = this.term();
      expr = { kind: "binary", left: expr, operator: op, right };
    }
    return expr;
  }
  private term(): Expr {
    let expr = this.factor();
    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const op = this.previous();
      const right = this.factor();
      expr = { kind: "binary", left: expr, operator: op, right };
    }
    return expr;
  }
  private factor(): Expr {
    let expr = this.unary();
    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const op = this.previous();
      const right = this.unary();
      expr = { kind: "binary", left: expr, operator: op, right };
    }
    return expr;
  }
  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const op = this.previous();
      const right = this.unary();
      return { kind: "unary", operator: op, right };
    }
    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else break;
    }
    return expr;
  }
  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')'.");
    return { kind: "call", callee, paren, args };
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return { kind: "literal", value: false };
    if (this.match(TokenType.TRUE)) return { kind: "literal", value: true };
    if (this.match(TokenType.NIL)) return { kind: "literal", value: null };
    if (this.match(TokenType.NUMBER, TokenType.STRING))
      return { kind: "literal", value: this.previous().literal };
    if (this.match(TokenType.IDENTIFIER))
      return { kind: "variable", name: this.previous() };
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')'.");
      return { kind: "group", expression: expr };
    }
    throw this.error(this.peek(), "Expect expression.");
  }

  // helpers
  private match(...types: TokenType[]): boolean {
    for (const t of types)
      if (this.check(t)) {
        this.advance();
        return true;
      }
    return false;
  }
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
  private peek(): Token {
    return this.tokens[this.current];
  }
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  private error(token: Token, message: string) {
    return new ParseError(
      `Parse error at ${token.line}:${token.col} near '${token.lexeme}': ${message}`
    );
  }
  private synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      switch (this.peek().type) {
        case TokenType.FN:
        case TokenType.LET:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
        case TokenType.PRINT:
          return;
      }
      this.advance();
    }
  }
}

export { Parser, ParseError };
