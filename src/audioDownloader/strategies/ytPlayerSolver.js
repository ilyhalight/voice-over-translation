// @ts-nocheck
// biome-ignore-all lint: Vendored from yt-dlp/ejs 0.8.0 (Unlicense).
/*!
 * SPDX-License-Identifier: Unlicense
 * Adapted from https://github.com/yt-dlp/ejs
 */
import * as astring from "astring";
import * as meriyah from "meriyah";

export const preprocessYouTubePlayer = (function (meriyah, astring) {
  "use strict";
  function matchesStructure(obj, structure) {
    if (Array.isArray(structure)) {
      if (!Array.isArray(obj)) return false;
      return (
        structure.length === obj.length &&
        structure.every((value, index) => matchesStructure(obj[index], value))
      );
    }
    if (typeof structure === "object") {
      if (!obj) return !structure;
      if ("or" in structure) {
        return structure.or.some((node) => matchesStructure(obj, node));
      }
      if ("anykey" in structure && Array.isArray(structure.anykey)) {
        const haystack = Array.isArray(obj) ? obj : Object.values(obj);
        return structure.anykey.every((value) =>
          haystack.some((element) => matchesStructure(element, value)),
        );
      }
      for (const [key, value] of Object.entries(structure)) {
        if (!matchesStructure(obj[key], value)) return false;
      }
      return true;
    }
    return structure === obj;
  }

  function generateArrowFunction(data) {
    return meriyah.parse(data).body[0].expression;
  }

  function optionalChain(operations) {
    let lastAccess;
    let value = operations[0];
    let index = 1;
    while (index < operations.length) {
      const operation = operations[index];
      const callback = operations[index + 1];
      index += 2;
      if (
        (operation === "optionalAccess" || operation === "optionalCall") &&
        value == null
      ) {
        return undefined;
      }
      if (operation === "access" || operation === "optionalAccess") {
        lastAccess = value;
        value = callback(value);
      } else if (operation === "call" || operation === "optionalCall") {
        value = callback((...args) => value.call(lastAccess, ...args));
        lastAccess = undefined;
      }
    }
    return value;
  }

  const identifier = {
    or: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: { or: [{ type: "Identifier" }, { type: "MemberExpression" }] },
          right: { type: "FunctionExpression", async: false },
        },
      },
      { type: "FunctionDeclaration", async: false, id: { type: "Identifier" } },
      {
        type: "VariableDeclaration",
        declarations: {
          anykey: [
            {
              type: "VariableDeclarator",
              init: { type: "FunctionExpression", async: false },
            },
          ],
        },
      },
    ],
  };
  const markerCall = {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier" },
        property: {},
        optional: false,
      },
      arguments: [
        { type: "Literal", value: "alr" },
        { type: "Literal", value: "yes" },
      ],
      optional: false,
    },
  };

  function extract(node) {
    if (!matchesStructure(node, identifier)) return null;
    const options = [];
    if (node.type === "FunctionDeclaration") {
      if (
        node.id &&
        optionalChain([
          node,
          "access",
          (value) => value.body,
          "optionalAccess",
          (value) => value.body,
        ])
      ) {
        options.push({
          name: node.id,
          statements: optionalChain([
            node,
            "access",
            (value) => value.body,
            "optionalAccess",
            (value) => value.body,
          ]),
        });
      }
    } else if (node.type === "ExpressionStatement") {
      if (node.expression.type !== "AssignmentExpression") return null;
      const name = node.expression.left;
      const body = optionalChain([
        node.expression.right,
        "optionalAccess",
        (value) => value.body,
        "optionalAccess",
        (value) => value.body,
      ]);
      if (name && body) options.push({ name, statements: body });
    } else if (node.type === "VariableDeclaration") {
      for (const declaration of node.declarations) {
        const name = declaration.id;
        const body = optionalChain([
          declaration.init,
          "optionalAccess",
          (value) => value.body,
          "optionalAccess",
          (value) => value.body,
        ]);
        if (name && body) options.push({ name, statements: body });
      }
    }
    for (const { name, statements } of options) {
      if (matchesStructure(statements, { anykey: [markerCall] })) {
        return createSolver(name);
      }
    }
    return null;
  }

  function createSolver(expression) {
    return generateArrowFunction(`
({sig, n}) => {
  const url = (${astring.generate(expression)})("https://youtube.com/watch?v=yt-dlp-wins", "s", sig ? encodeURIComponent(sig) : undefined);
  url.set("n", n);
  const proto = Object.getPrototypeOf(url);
  const keys = Object.keys(proto).concat(Object.getOwnPropertyNames(proto));
  for (const key of keys) {
    if (!["constructor", "set", "get", "clone"].includes(key)) {
      url[key]();
      break;
    }
  }
  const s = url.get("s");
  return {
    sig: s ? decodeURIComponent(s) : null,
    n: url.get("n") ?? null,
  };
}
`);
  }

  let setupNodes;

  function preprocessPlayer(data) {
    setupNodes ??= meriyah.parse(`
if (typeof globalThis.XMLHttpRequest === "undefined") {
  globalThis.XMLHttpRequest = { prototype: {} };
}
if (typeof globalThis.location === "undefined") {
  globalThis.location = new URL("https://www.youtube.com/watch?v=yt-dlp-wins");
}
if (typeof globalThis.document === "undefined") {
  globalThis.document = Object.create(null);
}
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = Object.create(null);
}
if (typeof globalThis.self === "undefined") {
  globalThis.self = globalThis;
}
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}
`).body;

    const program = meriyah.parse(data);
    const plainStatements = modifyPlayer(program);
    const solutions = getSolutions(plainStatements);
    for (const [name, options] of Object.entries(solutions)) {
      plainStatements.push({
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "MemberExpression",
            computed: false,
            object: { type: "Identifier", name: "_result" },
            property: { type: "Identifier", name },
            optional: false,
          },
          right: multiTry(options),
        },
      });
    }
    program.body.splice(0, 0, ...setupNodes);
    return astring.generate(program);
  }

  function modifyPlayer(program) {
    const body = program.body;
    const block = (() => {
      switch (body.length) {
        case 1: {
          const func = body[0];
          if (
            optionalChain([func, "optionalAccess", (value) => value.type]) ===
              "ExpressionStatement" &&
            func.expression.type === "CallExpression" &&
            func.expression.callee.type === "MemberExpression" &&
            func.expression.callee.object.type === "FunctionExpression"
          ) {
            return func.expression.callee.object.body;
          }
          break;
        }
        case 2: {
          const func = body[1];
          if (
            optionalChain([func, "optionalAccess", (value) => value.type]) ===
              "ExpressionStatement" &&
            func.expression.type === "CallExpression" &&
            func.expression.callee.type === "FunctionExpression"
          ) {
            const result = func.expression.callee.body;
            result.body.splice(0, 1);
            return result;
          }
          break;
        }
      }
      throw new Error("Unexpected YouTube player structure");
    })();
    block.body = block.body.filter((node) => {
      if (node.type === "ExpressionStatement") {
        if (node.expression.type === "AssignmentExpression") return true;
        return node.expression.type === "Literal";
      }
      return true;
    });
    return block.body;
  }

  function getSolutions(statements) {
    const found = { n: [], sig: [] };
    for (const statement of statements) {
      const result = extract(statement);
      if (result) {
        found.n.push(makeSolver(result, { type: "Identifier", name: "n" }));
        found.sig.push(makeSolver(result, { type: "Identifier", name: "sig" }));
      }
    }
    return found;
  }

  function makeSolver(result, identifierNode) {
    return {
      type: "ArrowFunctionExpression",
      params: [identifierNode],
      body: {
        type: "MemberExpression",
        object: {
          type: "CallExpression",
          callee: result,
          arguments: [
            {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  key: identifierNode,
                  value: identifierNode,
                  kind: "init",
                  computed: false,
                  method: false,
                  shorthand: true,
                },
              ],
            },
          ],
          optional: false,
        },
        computed: false,
        property: identifierNode,
        optional: false,
      },
      async: false,
      expression: true,
      generator: false,
    };
  }

  function multiTry(generators) {
    return generateArrowFunction(`
(_input) => {
  const _results = new Set();
  const errors = [];
  for (const _generator of ${astring.generate({ type: "ArrayExpression", elements: generators })}) {
    try {
      _results.add(_generator(_input));
    } catch (error) {
      errors.push(error);
    }
  }
  if (!_results.size) {
    throw new Error(\`no solutions: \${errors.join(", ")}\`);
  }
  if (_results.size !== 1) {
    throw new Error(\`invalid solutions: \${[..._results].map((value) => JSON.stringify(value)).join(", ")}\`);
  }
  return _results.values().next().value;
}
`);
  }

  return preprocessPlayer;
})(meriyah, astring);
