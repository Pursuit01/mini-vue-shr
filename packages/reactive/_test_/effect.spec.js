import { effect, jobQueue, flushJob } from "../src/effect";
import { describe, expect, it, vi } from "vitest";
import { reactive } from "../src/reactive";

// 测试数据
const data = {
  ok: true,
  text: "hello, world",
  title: "title",
  num: 2,
  bar: 2,
  foo: "foo",
};

describe("effect test", () => {
  const obj = reactive(data);

  it("effect run specified times", () => {
    const foo = {
      fn() {
        console.log(obj.noExists);
        // console.log(obj.text);
      },
    };
    const test = vi.spyOn(foo, "fn");
    effect(foo.fn);
    obj.noExists = "none";
    // obj.text = "hello, vue3";
    // expect(obj.text).toBe("hello, vue3");
    expect(test).toHaveBeenCalledTimes(2);
  });
  it("branch switching & dependence cleanup", () => {
    const foo = {
      fn() {
        console.log(obj.ok ? obj.text : "not");
      },
    };
    const test = vi.spyOn(foo, "fn");
    effect(foo.fn);
    // 当obj.ok置为 false 时，应当将副作用函数从obj.text的以来集中删除
    obj.ok = false;
    // 此时修改text的值，不应该再触发副作用函数
    obj.text = "123";
    expect(test).toHaveBeenCalledTimes(2);
  });
  it("effect嵌套", () => {
    const foo = {
      fn() {
        console.log(obj.text, "FN1执行了");
        effect(foo.fn2);
      },
      fn2() {
        console.log(obj.title, "fn2执行了");
      },
    };
    const test = vi.spyOn(foo, "fn"); // 监视外层函数
    const test2 = vi.spyOn(foo, "fn2"); // 监视内层函数
    effect(foo.fn);
    // 修改obj.title，只执行内层副作用函数
    // obj.title = "TITLE";
    // expect(test).toHaveBeenCalledTimes(1);
    // expect(test2).toHaveBeenCalledTimes(2);
    // 修改obj.text,触发外层副作用函数,同时导致内层函数也执行（类似于父组件渲染也会导致子组建的渲染）
    obj.text = "hello, vue3";
    expect(test).toHaveBeenCalledTimes(2);
    expect(test2).toHaveBeenCalledTimes(2);
  });
  it("在副作用函数中读取和修改同一个属性", () => {
    const foo = {
      fn() {
        obj.num++;
      },
    };
    const test = vi.spyOn(foo, "fn");
    effect(foo.fn);
    // 由于当前副作用函数和 trigger 触发执行的副作用函数是同一个，做一只执行一遍副作用函数，详情见 ../src/effect.js/trigger 函数
    expect(test).toHaveBeenCalledTimes(1);
  });

  it("副作用函数调度执行", () => {
    const foo = {
      fn() {
        console.log(obj.num);
      },
    };
    const test = vi.spyOn(foo, "fn");
    effect(foo.fn, {
      scheduler: (fn) => {
        setTimeout(fn, 0);
      },
    });
    obj.num++;
    console.log("结束了");
    // expect(test).toHaveBeenCalledTimes(2);
    // expect(obj.num).toBe(3); // 调度器函数执行了
  });

  it("任务队列", () => {
    const foo = {
      fn() {
        console.log(obj.num);
      },
    };
    const test = vi.spyOn(foo, "fn");
    effect(foo.fn, {
      scheduler: (fn) => {
        jobQueue.add(fn);
        flushJob();
      },
    });
    // obj.num++;
    // obj.num++;
    expect(obj.num).toBe(5); // 只会输出3和5，flushJob 也会同步且连续地执行两次，但由于isFlushing 标志的存在，实际上 flushJob 函数在一个事件循环内只会执行一次，即在微任务队列内执行一次。
  });
});
