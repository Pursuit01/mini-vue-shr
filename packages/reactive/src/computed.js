import { effect, track, trigger } from "./effect";

export function computed(getter) {
  // 用来缓存上一次的值
  let value;
  // dirty标志，用来表示是否需要重新计算值，为 true，则意味着 脏，需要计算
  let dirty = true;
  // 执行 effect 函数会返回一个封装后的副作用函数 effectFn，该函数的返回值则是传入的 getter 函数的运算结果

  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 当 getter 所依赖的属性变化时，副作用函数就会执行（即先执行 scheduler），一旦执行，就把dirty置为 true, 重新计算结果
      dirty = true;
      // ?? 当计算属性依赖的数据变化时，手动触发 trigger 函数执行副作用函数
      trigger(obj, "value");
    },
  });

  const obj = {
    // 当读取 value 的时候，才执行 effectFn 函数
    get value() {
      // 如果为 true才计算值，并将计算结果缓存到 value 中
      if (dirty) {
        // 一旦调用 effectFn，就会将 getter 函数的返回值通过 value 属性传递出去
        value = effectFn();
        // 将 dirty 置为 false，下次直接访问 value 的缓存值
        dirty = false;
      }
      // ?? 当读取 value 时，手动调用 track 函数进行追踪
      track(obj, "value");
      return value;
    },
  };
  return obj;
}
