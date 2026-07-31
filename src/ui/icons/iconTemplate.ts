const SVG_NS = "http://www.w3.org/2000/svg";

export interface IconNode {
  tag: string;
  attrs?: Record<string, string>;
  text?: string;
  children?: IconNode[];
}

function build(spec: IconNode): SVGElement {
  const el = document.createElementNS(SVG_NS, spec.tag) as SVGElement;
  if (spec.attrs) {
    for (const name in spec.attrs) el.setAttribute(name, spec.attrs[name]);
  }
  if (spec.text) el.textContent = spec.text;
  if (spec.children) {
    for (const child of spec.children) el.appendChild(build(child));
  }
  return el;
}

/**
 * Build an icon once, clone it per use.
 *
 * Icons are constructed with `createElementNS` rather than parsed from markup:
 * pages such as YouTube enforce `require-trusted-types-for 'script'`, which
 * rejects `innerHTML` *and* `DOMParser.parseFromString`. Building nodes
 * directly is the only sink-free option, and it also skips HTML parsing at
 * runtime entirely.
 *
 * Construction is lazy (first render), so importing this module never touches
 * the DOM. The returned thunk is exactly what `render()` accepts.
 */
export function iconTemplate(spec: IconNode): () => SVGElement {
  let prototypeNode: SVGElement | undefined;
  return () => {
    prototypeNode ??= build(spec);
    return prototypeNode.cloneNode(true) as SVGElement;
  };
}
