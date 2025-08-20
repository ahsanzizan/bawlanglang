export function assertUnreachable(x: never): never {
  throw new Error(`Reached unreachable code with value: ${String(x)}`);
}
