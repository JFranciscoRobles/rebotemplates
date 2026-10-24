// `npm run cli -- render template.docx data.json -o out.pdf`: the command line from its source.
import { run } from '../packages/cli/src/main';

const answer = await run(process.argv.slice(2).filter((arg, i) => !(i === 0 && arg === '--')));
if (answer.out) console.log(answer.out);
if (answer.err) console.error(answer.err);
process.exitCode = answer.code;
