import { describe, expect, it, vi } from "vitest";
import { generate } from "../src/generate";
import { parse } from "../src/parse";
import { dump, transform } from "../src/transform";
import { createCallExpression } from "../src/util";
describe("transform", () => {
  const template = `<div><p>qwe</p><p>asdc</p></div>`;
  it("查看dump输出", () => {
    let ast = parse(template);
    dump(ast);
  });
  it("transform", () => {
    const template = `<div><p>qwe</p><p>asdc</p></div>`;
    let ast = parse(template);
    transform(ast);
    // console.log(ast.jsNode);
    const code = generate(ast.jsNode);
    console.log(code);
  });
  it("util-createCallExpression", () => {
    let res = createCallExpression("h", [{ type: "String", value: "112" }]);
    // console.log(res);
  });
});
