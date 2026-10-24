// What @rebotemplates/core promises: rendering a template, checking it before,
// and saying what it asks for. Each name is here on purpose; a change to this
// list is a change of the API.

export { type Template, type TemplateSource, type Inspection, type VariableInfo, loadTemplate, inspect } from './template';
export { type RenderOptions, type Rendered, type Filled, type Problem, type Check, render, fill, check } from './render';
export type { Computed, Missing } from './data';
