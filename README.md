## BawlangLang (BLL)

Who would've guess that someone will build a trash language with another trash language.

Small interpreted language written in TypeScript, with a lexer → parser → interpreter pipeline and a simple REPL. It supports variables, arithmetic, boolean logic, blocks, `if`/`else`, `while`, functions, returns, and printing.

### Features

- **Statements**: variable declaration (`tetapkan`), expression statement, `keluar` (print), `if`/`selain`, `while`, `fn`, `return`
- **Expressions**: literals, identifiers, grouping, unary/binary ops, logical `&&`/`||`, function calls, assignments
- **Built-ins**: `print(x)`, `clock()`
- **REPL**: multi-line blocks with `{ }`, `:help`, `:q` to quit

### Quick start

1. Install deps

```bash
npm install
```

2. Build

```bash
npm run build
```

3. Run a program

```bash
node dist/main.js path/to/file.bll
```

4. REPL

```bash
node dist/main.js
```

You can also use the `start` script which builds then runs the REPL:

```bash
npm start
```

### Example program

`test/hello.bll`:

```bll
tetapkan x = 10 + 12;

keluar "Anjay mabar cuk cuk!";
keluar x;

jika (x == 22) { keluar "true bos"; }

tetapkan i = 0;
selama (i < 3) {
  keluar i; i = i + 1;
}
```

Run it:

```bash
node dist/main.js test/hello.bll
```

### CLI executable with pkg

This project is configured to bundle a standalone executable using `pkg`.

- Build JS output and rewrite TS path aliases:

```bash
npm run build
```

- Package for the configured targets (Windows/macOS/Linux, Node 18):

```bash
npx pkg . --out-path bin
```

This produces executables in `bin/`. The binary name is `bll` (from `package.json` `bin` field) pointing to `dist/main.js`. You can run:

```bash
./bin/bawlanglang-win.exe test/hello.bll    # Windows (example name)
./bin/bawlanglang-linux                     # Linux
./bin/bawlanglang-macos                     # macOS
```

Note: `pkg` will pick target names; see the artifacts created in `bin/`.

### Usage

- Run a file: `node dist/main.js file.bll`
- Start REPL: `node dist/main.js`
- REPL commands: `:help`, `:q`

### Language reference (brief)

- **Literals**: numbers, strings, `true`, `false`, `nil`
- **Variables**: `tetapkan x = 123;`
- **Print**: statement form `keluar expr;` or builtin function `print(expr);`
- **Blocks**: `{ statement* }`
- **If / Else**: `jika (cond) { ... }` `selain { ... }`
- **While**: `selama (cond) { ... }`
- **Functions**: `fn add(a, b) { return a + b; }` then call `add(1, 2);`
- **Operators**:
  - Unary: `-`, `!`
  - Binary: `+`, `-`, `*`, `/`, `>`, `>=`, `<`, `<=`, `==`, `!=`
  - Logical: `&&`, `||` (short-circuit)
  - Grouping: `( ... )`
  - Assignment: `name = expr;`

Keywords used by the lexer (in `src/core/lexer/keywords.ts`):

- `tetapkan` (let), `keluar` (print), `jika`/`selain` (if/else), `selama` (while), `fn`, `return`, `true`, `false`, `nil`

### Project structure

```
src/
  core/
    ast.ts              # AST node types (Expr, Stmt)
    lexer/              # Lexer, tokens, token types, keywords
    parser.ts           # Recursive descent parser
    interpreter/        # Interpreter runtime, env, functions, return signal
  main.ts               # CLI entrypoint + REPL
```

TypeScript path aliases are defined in `tsconfig.json` (`@core/*`, `@util/*`). The build runs `tsc-alias` to rewrite these to relative paths in `dist/` so Node and `pkg` can resolve them.

### Development

- Build: `npm run build`
- Type-check only: `npm run typecheck`
- Start (build + REPL): `npm start`

### Implementation notes

- Errors include line/col; the lexer now tracks token start positions for better diagnostics.
- Switch statements over AST kinds use an exhaustive check helper to catch missing cases during development.
- The interpreter defines globals `clock` and `print`.

### Roadmap ideas

- Arrays, maps, and user-defined types
- File I/O and standard library modules
- Better diagnostics with source ranges
- Unit tests for lexer/parser/interpreter

### License

MIT
