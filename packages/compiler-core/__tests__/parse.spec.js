import { describe, expect, it, vi } from "vitest";
import { tokenize, parse } from "../src/parse";

describe("测试parse函数", () => {
  it("tokenize", () => {
    const template = `<p>Vue</p>`;
    let token = tokenize(template);
    console.log(token);
  });
  it("parse", () => {
    const template = `<p><span>qwe</span><span>asdc</span></p>`;
    let ast = parse(template);
    console.log(ast);
  });
});
