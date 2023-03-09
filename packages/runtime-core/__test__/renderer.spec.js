import { describe, expect, it, vi } from "vitest";
import { createRenderer } from "../src/renderer";
import { ref } from "../../reactive/src/reactive";
import { effect } from "../../reactive/src/effect";
const options = {
  createElement(tag) {
    console.log(`创建 ${tag} 元素`);
    return { tag };
  },
  insert(el, container) {
    console.log(`将 ${el} 插入到 ${container} 中`);
    return true;
  },
  setElementText(el, text) {
    console.log(`将 ${el} 的文本设置为 ${text}`);
    return;
  },
};
describe("测试 renderer 渲染函数", () => {
  it("测试响应式", () => {
    const count = ref(1);
    const dom = { innerHTML: "" };
    const renderer = createRenderer(options);
    const fun = {
      foo() {
        renderer.render(`<h2>${count.value}</h2>`, dom);
      },
    };
    const test = vi.spyOn(fun, "foo");
    effect(fun.foo);
    count.value++;
    expect(test).toBeCalledTimes(2);
    console.log(dom);
  });

  it("测试挂载函数的平台兼容性", () => {
    const vnode = { type: "h1", children: "hello" };
    const container = { type: "root" };
    const renderer = createRenderer(options);
    renderer.render(vnode, container);
    /**
     * 输出：
     * 创建 h1 元素
     * 将 h1 的文本设置为 hello
     * 将 h1 插入到 root 中
     */
  });
});
