enum TokenType {
  // single-char
  LEFT_PAREN,
  RIGHT_PAREN,
  LEFT_BRACE,
  RIGHT_BRACE,
  COMMA,
  DOT,
  MINUS,
  PLUS,
  SEMICOLON,
  SLASH,
  STAR,
  // one/two-char
  BANG,
  BANG_EQUAL,
  EQUAL,
  EQUAL_EQUAL,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,
  AND_AND,
  OR_OR,
  // literals
  IDENTIFIER,
  STRING,
  NUMBER,
  // keywords
  LET,
  TRUE,
  FALSE,
  NIL,
  IF,
  ELSE,
  WHILE,
  FN,
  RETURN,
  PRINT,
  EOF,
}

const keywords: Record<string, TokenType> = {
  let: TokenType.LET,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  nil: TokenType.NIL,
  if: TokenType.IF,
  else: TokenType.ELSE,
  selama: TokenType.WHILE,
  fn: TokenType.FN,
  return: TokenType.RETURN,
  keluar: TokenType.PRINT,
};

class Token {
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

class Lexer {
  private start = 0;
  private current = 0;
  private line = 1;
  private col = 1;
  constructor(private src: string) {}
  scanTokens(): Token[] {
    const tokens: Token[] = [];
    while (!this.isAtEnd()) tokens.push(this.scanToken());
    tokens.push(new Token(TokenType.EOF, "", null, this.line, this.col));
    return tokens;
  }
  private isAtEnd() {
    return this.current >= this.src.length;
  }
  private advance(): string {
    const ch = this.src[this.current++];
    if (ch === "\n") {
      this.line++;
      this.col = 1;
    } else this.col++;
    return ch;
  }
  private peek() {
    return this.isAtEnd() ? "\0" : this.src[this.current];
  }
  private peekNext() {
    return this.current + 1 >= this.src.length
      ? "\0"
      : this.src[this.current + 1];
  }
  private match(expected: string) {
    if (this.isAtEnd() || this.src[this.current] !== expected) return false;
    this.current++;
    this.col++;
    return true;
  }
  private make(type: TokenType, literal: any = null, lexeme?: string) {
    const text = lexeme ?? this.src.slice(this.start, this.current);
    return new Token(type, text, literal, this.line, this.col);
  }

  private skipWhitespace() {
    for (;;) {
      const c = this.peek();
      switch (c) {
        case " ":
        case "\r":
        case "\t":
          this.advance();
          break;
        case "\n":
          this.advance();
          break;
        case "/":
          if (this.peekNext() === "/") {
            while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
          } else {
            return;
          }
          break;
        default:
          return;
      }
    }
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) this.advance();
    if (this.isAtEnd()) throw this.error("Unterminated string.");
    this.advance();
    const value = this.src.slice(this.start + 1, this.current - 1);
    return this.make(TokenType.STRING, value);
  }

  private number() {
    while (/\d/.test(this.peek())) this.advance();
    if (this.peek() === "." && /\d/.test(this.peekNext())) {
      this.advance();
      while (/\d/.test(this.peek())) this.advance();
    }
    return this.make(
      TokenType.NUMBER,
      Number(this.src.slice(this.start, this.current))
    );
  }

  private identifier() {
    while (/[a-zA-Z_\d]/.test(this.peek())) this.advance();
    const text = this.src.slice(this.start, this.current);
    const type = keywords[text] ?? TokenType.IDENTIFIER;
    return this.make(type);
  }

  private error(msg: string): Error {
    return new Error(`Lexer error at ${this.line}:${this.col} — ${msg}`);
  }

  private scanToken(): Token {
    this.skipWhitespace();
    this.start = this.current; // token start
    if (this.isAtEnd()) return this.make(TokenType.EOF);
    const c = this.advance();
    // single-char
    switch (c) {
      case "(":
        return this.make(TokenType.LEFT_PAREN);
      case ")":
        return this.make(TokenType.RIGHT_PAREN);
      case "{":
        return this.make(TokenType.LEFT_BRACE);
      case "}":
        return this.make(TokenType.RIGHT_BRACE);
      case ",":
        return this.make(TokenType.COMMA);
      case ".":
        return this.make(TokenType.DOT);
      case "-":
        return this.make(TokenType.MINUS);
      case "+":
        return this.make(TokenType.PLUS);
      case ";":
        return this.make(TokenType.SEMICOLON);
      case "*":
        return this.make(TokenType.STAR);
      case "!":
        return this.make(
          this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG
        );
      case "=":
        return this.make(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
      case "<":
        return this.make(
          this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS
        );
      case ">":
        return this.make(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
      case "&":
        if (this.match("&")) return this.make(TokenType.AND_AND);
        break;
      case "|":
        if (this.match("|")) return this.make(TokenType.OR_OR);
        break;
      case "/":
        return this.make(TokenType.SLASH);
      case '"':
        return this.string();
    }
    if (/\d/.test(c)) return this.number();
    if (/[a-zA-Z_]/.test(c)) return this.identifier();
    throw this.error(`Unexpected character '${c}'`);
  }
}

export { Lexer, TokenType, Token };
