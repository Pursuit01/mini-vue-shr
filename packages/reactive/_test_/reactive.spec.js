import { effect } from "../src/effect";
import { describe, expect, it, vi } from "vitest";
import {
  reactive,
  shallowReactive,
  readonly,
  shallowReadonly,
  ref,
  toRef,
  toRefs,
  proxyRefs,
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

  it("手动实现数组迭代器方法", () => {
    const arr = [1, 2, 3, 4, 5];
    arr[Symbol.iterator] = function () {
      let target = this;
      let length = target.length;
      let index = 0;
      return {
        next() {
          return {
            value: index < length ? arr[index] : undefined,
            done: index++ >= length,
          };
        },
      };
    };
    for (const it of arr) {
      console.log(it);
    }
  });

  it("测试数组的includes方法", () => {
    const obj = {};
    const arr = reactive([obj]);
    expect(arr.includes(arr[0])).toBe(true);
  });

  it("测试数组的includes方法2", () => {
    const obj = {};
    const originArr = [obj];
    const arr = reactive(originArr);
    // 重写了数组的 includes 方法，如果在代理对象 arr 上查找不到，就去原始对象 originArr 上查找
    expect(arr.includes(obj)).toBe(true);
  });
  it("测试push方法", () => {
    const arr = reactive([]);
    effect(() => {
      arr.push(1);
    });
    effect(() => {
      arr.push(1);
    });
    expect(arr.length).toBe(2);
  });

  it("测试set对象的size属性", () => {
    const set = new Set();
    const res = reactive(set);
    expect(res.size).toBe(0);
  });
  // it("测试set对象的delete方法", () => {
  //   const set = new Set([1, 2, 3]);
  //   const res = reactive(set);
  //   res.delete(1);
  //   expect(res.size).toBe(2);
  // });
  it("测试ref", () => {
    const obj = ref(1);
    expect(obj.value).toBe(1);
  });
  it("测试toRef", () => {
    const obj = reactive({ a: 1 });
    const newVal = toRef(obj, "a");
    newVal.value = 100;
    expect(obj.a).toBe(100);
  });

  it("测试toRefs", () => {
    const obj = reactive({ a: 1, b: 2 });
    const newObj = { ...toRefs(obj) };

    expect(newObj.a.value).toBe(1);
    expect(newObj.b.value).toBe(2);
  });
  it("测试toRefs的自动脱ref", () => {
    const obj = reactive({ a: 1, b: 2 });
    const newObj = proxyRefs({ ...toRefs(obj) });

    expect(newObj.a).toBe(1);
    expect(newObj.b).toBe(2);
  });
});
