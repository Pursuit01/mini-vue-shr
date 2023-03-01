import { effect } from "../src/effect";
import { computed } from "../src/computed";
import { reactive } from "../src/reactive";

import { describe, expect, it, vi } from "vitest";
// 测试数据
const data = {
  ok: true,
  text: "hello, world",
  title: "title",
  num: 2,
  bar: 2,
  foo: "foo",
};

describe("计算属性", () => {
  const obj = reactive(data);
  it("测试计算属性", () => {
    let effectFn = effect(() => obj.bar * 2, {
      lazy: true,
    });
    let value = effectFn();
    expect(value).toBe(4);
  });
  it("测试computed函数", () => {
    let res = computed(() => 10 * 5);
    expect(res.value).toBe(50);
  });

  it("测试computed的缓存功能", () => {
    let res = computed(() => obj.bar * 2);
    expect(res.value).toBe(4);
    obj.bar++; // 3
    expect(res.value).toBe(6);
  });

  it("在副作用函数中读取computed", () => {
    const sumRes = computed(() => obj.bar * 3);
    effect(() => {
      console.log(sumRes.value); // 9
    });
    obj.bar++;
    // console.log(sumRes.value); // 12
  });
});
