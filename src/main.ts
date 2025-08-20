import * as fs from "node:fs";
import * as readline from "node:readline";
import { Interpreter } from "./interpreter";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

function run(src: string, output: (s: string) => void = console.log) {
  const lexer = new Lexer(src);
  const tokens = lexer.scanTokens();
  const parser = new Parser(tokens);
  const statements = parser.parse();
  const interpreter = new Interpreter(output);
  interpreter.interpret(statements);
}

async function repl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "bll> ",
  });
  const buffer: string[] = [];
  const interpreter = new Interpreter((s) => console.log(s));
  const evalLine = (code: string) => {
    try {
      const lexer = new Lexer(code);
      const tokens = lexer.scanTokens();
      const parser = new Parser(tokens);
      const statements = parser.parse();
      interpreter.interpret(statements);
    } catch (e: any) {
      console.error(e?.message ?? e);
    }
  };
  rl.prompt();
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      rl.prompt();
      return;
    }
    if (trimmed === ":quit" || trimmed === ":q") {
      rl.close();
      return;
    }
    if (trimmed === ":help") {
      console.log(
        "Commands: :help :q  — statements end with ;  blocks use { }"
      );
      rl.prompt();
      return;
    }

    buffer.push(line);
    const joined = buffer.join("\n");
    const open = (joined.match(/\{/g) || []).length;
    const close = (joined.match(/\}/g) || []).length;
    if (open > close) {
      rl.setPrompt(".... ");
      rl.prompt();
      return;
    }
    rl.setPrompt("bll> ");
    evalLine(joined);
    buffer.length = 0;
    rl.prompt();
  });
}

function main() {
  const file = process.argv[2];
  if (file) {
    if (!file.toLowerCase().endsWith(".bll")) {
      console.error(`Only .bll files can be run. Provided: ${file}`);
      process.exit(1);
    }
    const src = fs.readFileSync(file, "utf8");
    try {
      run(src);
    } catch (e: any) {
      console.error(e?.message ?? e);
      process.exit(1);
    }
  } else {
    console.log("BawlangLang REPL — type :help for help, :q to quit");
    repl();
  }
}

main();
