import { describe, expect, it, vi } from "vitest";
import { obj, effect } from "../src/effect";
import { watch } from "../src/watch";

describe("测试watch", () => {
  it("测试watch监听对象", () => {
    watch(
      obj,
      () => {
        console.log(123);
      },
      {
        immediate: true,
      }
    );
    // 修改 obj 的任意属性，都会输出一遍 123
    obj.foo = "qwe";
    obj.text = "hello";
  });

  it("测试watch监听数组", () => {
    let arr = [1, 2, 3, 4];
    let flag = 1;
    watch(
      arr,
      () => {
        flag++;
      },
      {
        immediate: true,
      }
    );
    arr.push(9);
    // expect(flag).toBe(3);
  });
});
