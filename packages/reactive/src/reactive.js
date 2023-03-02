import { createReactive } from "./effect";

// 创建一个原始对象与代理对象的映射
let reactiveMap = new Map();

export function reactive(data) {
  // 优先通过原始对象寻找之前创建的代理对象
  const existionProxy = reactiveMap.get(data);
  // 找到了直接返回
  if (existionProxy) {
    return existionProxy;
  }
  // 如果找不到，就创建新的代理对象并存储到 map 中
  const proxy = createReactive(data);
  reactiveMap.set(data, proxy);
  return proxy;
}

export function shallowReactive(data) {
  return createReactive(data, true);
}
export function readonly(data) {
  return createReactive(data, false, true);
}

export function shallowReadonly(data) {
  return createReactive(data, true, true);
}
