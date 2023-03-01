import { effect } from "../src/effect";
import { describe, expect, it, vi } from "vitest";
import {
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
} from "../src/reactive";

describe("reactive", () => {
  it("test reactive", () => {
    const obj = {};
    const proto = { bar: 1 };
    const child = reactive(obj);
    const parent = reactive(proto);
    Object.setPrototypeOf(child, parent);
    const foo = {
      fn() {
        console.log(child.bar);
      },
    };
    const test = vi.spyOn(foo, "fn");
    effect(foo.fn);
    child.bar = 2;
    expect(test).toHaveBeenCalledTimes(2);
  });

  it("测试reactive是否为深响应", () => {
    const data = reactive({
      foo: { bar: 1 },
    });
    const foo = {
      fn() {
        console.log(data.foo.bar);
      },
    };
    const test = vi.spyOn(foo, "fn");

    effect(foo.fn);
    data.foo.bar = 100;
    expect(test).toHaveBeenCalledTimes(2); // 要求更改深层次的属性，也能执行副作用函数
  });

  it("测试shallowReactive", () => {
    const data = shallowReactive({
      foo: { bar: 1 },
    });
    const foo = {
      fn() {
        console.log(data.foo.bar);
      },
    };
    const test = vi.spyOn(foo, "fn");

    effect(foo.fn);
    data.foo.bar = 100;
    expect(test).toHaveBeenCalledTimes(1);
  });

  it("测试shallowReadonly", () => {
    const data = shallowReadonly({
      baz: 2,
    });
    data.baz = 10;
    expect(data.baz).toBe(2);
  });

  it("测试readonly", () => {
    const data = readonly({
      foo: { bar: 1 },
    });
    data.foo.bar = 100; // 无法修改并报错
    expect(data.foo.bar).toBe(1);
  });
});
