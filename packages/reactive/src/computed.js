import { effect } from "./effect";

export function computed(getter) {
  // 执行 effect 函数会返回一个封装后的副作用函数 effectFn，该函数的返回值则是传入的 getter 函数的运算结果
  const effectFn = effect(getter, {
    lazy: true,
  });
  const obj = {
    // 当读取 value 的时候，才执行 effectFn 函数
    get value() {
      // 一旦调用 effectFn，就会将 getter 函数的返回值通过 value 属性传递出去
      return effectFn();
    },
  };
  return obj;
}
