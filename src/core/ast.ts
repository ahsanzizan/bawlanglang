import { Token } from "./lexer";

type Expr =
  | { kind: "literal"; value: any }
  | { kind: "variable"; name: Token }
  | { kind: "assign"; name: Token; value: Expr }
  | { kind: "unary"; operator: Token; right: Expr }
  | { kind: "binary"; left: Expr; operator: Token; right: Expr }
  | { kind: "logical"; left: Expr; operator: Token; right: Expr }
  | { kind: "group"; expression: Expr }
  | { kind: "call"; callee: Expr; paren: Token; args: Expr[] };

type Stmt =
  | { kind: "expr"; expression: Expr }
  | { kind: "print"; expression: Expr }
  | { kind: "var"; name: Token; initializer?: Expr }
  | { kind: "block"; statements: Stmt[] }
  | { kind: "if"; condition: Expr; thenBranch: Stmt; elseBranch?: Stmt }
  | { kind: "while"; condition: Expr; body: Stmt }
  | { kind: "fn"; name: Token; params: Token[]; body: Stmt[] }
  | { kind: "return"; keyword: Token; value?: Expr };

export { Expr, Stmt };

// Utility type to enforce exhaustiveness in switches over Expr/Stmt
export type Never = never;
