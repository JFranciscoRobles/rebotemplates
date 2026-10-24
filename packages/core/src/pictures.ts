// Pictures for {{name | image}}, made ready before a template is filled.
// Rebodocs takes a picture as a data: address, which travels in a JSON as
// any other value (see its fillimages.ts); here, the other ways a picture
// comes in are turned into one: its bytes, a path, an address on the web.

import { imageTypeOf } from '@rebodocs/core';
import { holders } from './data';
import { type TemplateSource, loadTemplate } from './template';

/** The names of the formats that make a variable a picture, in English and in Spanish, as Rebodocs reads them. */
const PICTURE = /^\s*(image|imagen|picture|foto)\s*(:|$)/i;

/** Whether a variable written with these formats is a picture. */
export const isPicture = (formats: string[]): boolean => formats.some((format) => PICTURE.test(format));

/** Bytes as base64, in a page, a Worker or Node alike. */
function base64(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

/** The bytes of a picture as a data: address; undefined when they are not a PNG, a JPEG or a GIF. */
export function pictureAddress(bytes: Uint8Array | ArrayBuffer): string | undefined {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const type = imageTypeOf(view);
  return type ? `data:${type};base64,${base64(view)}` : undefined;
}

/** The names of a template's variables that are pictures. */
export const pictureNames = (source: TemplateSource): string[] => loadTemplate(source).pictures;

type Load<T> = (value: string) => T;

/**
 * A copy of the data with each picture the template asks for given as a
 * data: address: bytes as they are, and any other text through `load`, which
 * gives its bytes or undefined (a path read from a folder, an address
 * fetched). A value already a data: address, or that cannot be loaded, is
 * left as it is: `check` says the second.
 */
export function resolvePictures(source: TemplateSource, data: Record<string, unknown>, load: Load<Uint8Array | ArrayBuffer | undefined> = () => undefined): Record<string, unknown> {
  const copy = structuredClone(data);
  for (const name of loadTemplate(source).pictures) {
    const path = name.split('.');
    const last = path[path.length - 1];
    for (const { holder } of holders(copy, path)) {
      const value = holder[last];
      if (value instanceof Uint8Array || value instanceof ArrayBuffer) holder[last] = pictureAddress(value) ?? value;
      else if (typeof value === 'string' && !value.startsWith('data:')) {
        const bytes = load(value);
        if (bytes) holder[last] = pictureAddress(bytes) ?? value;
      }
    }
  }
  return copy;
}

/**
 * As `resolvePictures`, for pictures that come from the web: each address is
 * fetched (with `fetch`, or the one given), all at once. In a page, the
 * address must let the page read it.
 */
export async function fetchPictures(source: TemplateSource, data: Record<string, unknown>, options: { fetch?: typeof fetch } = {}): Promise<Record<string, unknown>> {
  const get = options.fetch ?? fetch;
  const wanted = new Set<string>();
  resolvePictures(source, data, (value) => {
    if (/^https?:\/\//i.test(value)) wanted.add(value);
    return undefined;
  });
  const fetched = new Map<string, Uint8Array>();
  await Promise.all(
    [...wanted].map(async (address) => {
      const answer = await get(address);
      if (answer.ok) fetched.set(address, new Uint8Array(await answer.arrayBuffer()));
    }),
  );
  return resolvePictures(source, data, (value) => fetched.get(value));
}
