// A Model Context Protocol server for templates: what an assistant talks to.
// It speaks JSON-RPC, a message a line, as Rebodocs' own MCP server does
// (packages/mcp/src/server.ts there), with no SDK; `main.ts` runs it over
// standard input and output. Node only.

import { resolve } from 'node:path';
import { version } from '../package.json';
import { type Context, TOOLS, ToolError, findTool } from './tools';

export interface ServerOptions {
  /** The folder of templates; relative paths start here. */
  dir: string;
  /** Other folders documents may be written to. */
  out?: string[];
  /** Folders of fonts for PDFs, before the system's. */
  fonts?: string[];
}

export interface Message {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS =
  'Tools for a folder of Word templates. A template is a .docx with {{variables}} in it: {{client.name}}, {{price | currency}}; {{#items}} … {{/items}} repeats for each item of a list ' +
  '(a row of a table, or paragraphs); {{#paid}} … {{/paid}} is kept when the value is there, {{^paid}} … {{/paid}} when it is not. To make a document: inspect_template ' +
  'for the data it asks for, check_data, then render_document. To make a template from a finished document: read it, propose to the person which texts become ' +
  'variables, which row repeats and which paragraphs depend on a value, show them make_template with dry_run, and write it once they agree.';

export function createTemplateServer(options: ServerOptions) {
  const context: Context = { dir: resolve(options.dir), out: (options.out ?? []).map((dir) => resolve(dir)), fonts: options.fonts ?? [] };
  const listed = TOOLS.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: { type: 'object', properties: tool.properties, required: tool.required ?? [] },
    annotations: { title: tool.title, openWorldHint: false, ...tool.annotations },
  }));

  return {
    async handle(message: Message): Promise<object | undefined> {
      const { id, method, params = {} } = message;
      const answer = (result: object) => (id === undefined || id === null ? undefined : { jsonrpc: '2.0', id, result });
      switch (method) {
        case 'initialize': {
          const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
          return answer({
            protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
            capabilities: { tools: {} },
            serverInfo: { name: 'rebotemplates', title: 'ReboTemplates', version },
            instructions: INSTRUCTIONS,
          });
        }
        case 'ping':
          return answer({});
        case 'tools/list':
          return answer({ tools: listed });
        case 'tools/call': {
          const tool = findTool(String(params.name ?? ''));
          const args = params.arguments && typeof params.arguments === 'object' ? (params.arguments as Record<string, unknown>) : {};
          if (!tool) return answer({ content: [{ type: 'text', text: `No tool "${params.name}".` }], isError: true });
          try {
            return answer({ content: [{ type: 'text', text: tool.run(context, args) }] });
          } catch (error) {
            // What the assistant can put right is said to it as the result of the tool; anything else is a fault of the server.
            const said = error instanceof Error ? error.message : String(error);
            return answer({ content: [{ type: 'text', text: error instanceof ToolError ? said : `The tool failed: ${said}` }], isError: true });
          }
        }
        default:
          // Notifications ask for no answer; a request for something else gets told so.
          if (id === undefined || id === null) return undefined;
          return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
      }
    },
  };
}

export { TOOLS, ToolError, exampleData } from './tools';
export { type Marking, type Made, markTemplate } from './make';
