import { TokenType } from "./tokenType";

export const keywords: Record<string, TokenType> = {
  tetapkan: TokenType.LET,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  nil: TokenType.NIL,
  jika: TokenType.IF,
  selain: TokenType.ELSE,
  selama: TokenType.WHILE,
  fn: TokenType.FN,
  return: TokenType.RETURN,
  keluar: TokenType.PRINT,
};
