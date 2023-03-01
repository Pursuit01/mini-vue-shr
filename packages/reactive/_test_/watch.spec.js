import { describe, expect, it, vi } from "vitest";
import { effect } from "../src/effect";
import { reactive } from "../src/reactive";
import { watch } from "../src/watch";
// 测试数据
const data = {
  ok: true,
  text: "hello, world",
  title: "title",
  num: 2,
  bar: 2,
  foo: "foo",
};
describe("测试watch", () => {
  const obj = reactive(data);

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
