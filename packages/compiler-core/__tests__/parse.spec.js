import { describe, expect, it, vi } from "vitest";
import { tokenize } from "../src/parse";

describe("测试parse函数", () => {
  it("tokenize", () => {
    const template = `<p>Vue</p>`;
    let token = tokenize(template);
    console.log(token);
  });
});
