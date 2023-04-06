import { describe, expect, it, vi } from "vitest";
import { tokenize, parse } from "../src/parse";
import { dump } from "../src/transform";
describe("transform", () => {
  it("查看dump输出", () => {
    const template = `<p><span>qwe</span><span>asdc</span></p>`;
    let ast = parse(template);
    dump(ast);
  });
});
