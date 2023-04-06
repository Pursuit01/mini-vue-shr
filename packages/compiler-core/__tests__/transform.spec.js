import { describe, expect, it, vi } from "vitest";
import { parse } from "../src/parse";
import { dump, transform } from "../src/transform";
describe("transform", () => {
  const template = `<div><p>qwe</p><p>asdc</p></div>`;
  it("查看dump输出", () => {
    let ast = parse(template);
    dump(ast);
  });
  it("transform", () => {
    transform(parse(template));
  });
});
