// The command, as npm installs it: what run() answers, printed, and its code as the exit code.
import { run } from './main';

const answer = await run(process.argv.slice(2));
if (answer.out) console.log(answer.out);
if (answer.err) console.error(answer.err);
process.exitCode = answer.code;
