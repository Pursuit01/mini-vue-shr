import { obj, effect } from "../src/effect";
import { computed } from "../src/computed";

import { describe, expect, it, vi } from "vitest";
describe("计算属性", () => {
  it("测试计算属性", () => {
    let effectFn = effect(() => obj.num * 2, {
      lazy: true,
    });
    let value = effectFn();
    expect(value).toBe(4);
  });
  it("测试computed函数", () => {
    let res = computed(() => 10 * 5);
    expect(res.value).toBe(50);
  });
});
