// Runs the server for an assistant to connect to, over standard input and
// output: the way a client such as Claude Desktop starts one.
//
//   rebotemplates-mcp --dir ./templates [--out ./documents] [--fonts ./fonts]
//
// Standard output carries the protocol and nothing else; what there is to say
// to a person goes to standard error.

import { existsSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { type Message, createTemplateServer } from './server';

const args = process.argv.slice(2);
const values = (name: string): string[] => {
  const out: string[] = [];
  for (let i = args.indexOf(name); i >= 0; i = args.indexOf(name)) out.push(...args.splice(i, 2).slice(1));
  return out;
};
const dir = values('--dir')[0] ?? process.cwd();
const out = values('--out');
const fonts = values('--fonts');
if (args.length || !existsSync(dir) || !statSync(dir).isDirectory()) {
  console.error('Usage: rebotemplates-mcp --dir ./templates [--out ./documents]… [--fonts ./fonts]…');
  process.exit(2);
}

const server = createTemplateServer({ dir, out, fonts });
console.error(`rebotemplates-mcp: ready, on the templates of ${dir}.`);

const send = (message: object) => process.stdout.write(`${JSON.stringify(message)}\n`);
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', (line) => {
  if (!line.trim()) return;
  let message: Message;
  try {
    message = JSON.parse(line);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  void server
    .handle(message)
    .then((answer) => answer && send(answer))
    .catch((error: unknown) => send({ jsonrpc: '2.0', id: message.id ?? null, error: { code: -32603, message: error instanceof Error ? error.message : String(error) } }));
});
// The client closing its end is how it says it is done.
lines.on('close', () => process.exit(0));
