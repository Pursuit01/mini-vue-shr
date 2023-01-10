// WeakMap优点：一旦 target 被 GC，weakmap 的 key 和 value 就都访问不到了，防止内存泄漏
/**
 * new WeakMap()
 *    |
 *   target--- new Map
 *                |
 *               key----new Set() set集合用来存储与属性相关的副作用函数，可以自动去除相同的依赖函数
 */
const bucket = new WeakMap();

// 测试数据
const data = {
  ok: true,
  text: "hello, world",
  title: "title",
  num: 2,
  bar: 2,
  foo: "foo",
};

// 全局变量用来存储 副作用函数
let activeEffect = null;

// 定义 effect 栈，用于解决副作用函数嵌套的情况，activeEffect 始终指向栈顶元素
let effectStack = [];

export const obj = new Proxy(data, {
  // 拦截属性的读取操作
  get(target, key) {
    // 追踪属性读取操作
    track(target, key);
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    // 属性被修改时，触发追踪的副作用函数重新执行
    return trigger(target, key);
  },
});

export function track(target, key) {
  if (!activeEffect) return;
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  // deps 就是与当前副作用函数存在关联的依赖集合
  // 将该依赖集合添加到 activeEffect.deps 中去，是一个双向引用
  activeEffect.deps.push(deps);
}

export function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);

  // 将 effects 拷贝一份再遍历，防止 forEach 时出现 栈溢出
  // const effectsToRun = new Set(effects);
  const effectsToRun = new Set();
  effects &&
    effects.forEach((fn) => {
      // 添加守卫条件，处理在副作用函数中对某个属性同时进行读取和修改操作
      // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数是同一个，则不触发执行
      if (fn !== activeEffect) {
        effectsToRun.add(fn);
      }
    });
  effectsToRun.forEach((effectFn) => {
    // 如果副作用函数中存在调度器，则调用调度器，并将副作用函数作为参数传递
    if (effectFn.options.scheduler) {
      // console.log("调度器执行了");
      effectFn.options.scheduler(effectFn);
    } else {
      // 否则直接执行副作用函数（之前的默认行为）
      effectFn();
    }
  });
  // effects && effects.forEach((fn) => fn());
  return true;
}

// 注意 此时 cleanup 操作了 bucket 中的 set 集合
function cleanup(effectFn) {
  // 由于 effectFn.deps 中保存的是 bucket 中指定 key 的依赖集合的引用，所以可以通过 effectFn.deps 去操作 bucket 中的 set 集合
  effectFn.deps.forEach((deps) => {
    deps.delete(effectFn);
  });

  // 操作完 bucket 中的 set 集合后，当前依赖函数就不存在于任何 set 集合中了，所以需要将 effectFn.deps 清空
  // 接着就会再次调用 effectFn 函数，重新进行依赖的收集操作
  effectFn.deps.length = 0;
}

// 副作用函数
export function effect(fn, options = {}) {
  // 将副作用函数在原有功能上再封装一层，用来添加新的功能
  const effectFn = () => {
    // 在每次副作用函数 effectFn 调用之前，都进行 cleanup 用于清除依赖
    cleanup(effectFn);
    // 当 effectFn 执行时，将其赋值给 activeEffect
    activeEffect = effectFn;
    // 在调用副作用函数之前将当前副作用函数推入栈中
    effectStack.push(effectFn);
    // 保存一下执行副作用函数的值
    const res = fn();
    // 在副作用函数调用结束后，出栈
    effectStack.pop();
    // 并更新 activeEffect 的值为栈顶元素
    activeEffect = effectStack[effectStack.length - 1];

    // 把副作用函数的执行结果返回出去
    return res;
  };
  // 将 options 挂载到 effectFn 上
  effectFn.options = options;

  // 用来存储所有与当前副作用函数相关联的依赖集合
  // 由于把 effectFn 赋给了 activeEffect ，所以也可以通过 activeEffect 获取到该数组
  effectFn.deps = [];

  // 执行副作用函数，保留之前的功能
  // effectFn()
  if (!options.lazy) {
    effectFn();
  }
  // 将封装后的副作用函数返回出去，这样方便手动去调用副作用函数
  return effectFn;
}
export const jobQueue = new Set();
const p = Promise.resolve();

let isFlushing = false;
export function flushJob() {
  if (isFlushing) return;
  isFlushing = true;
  p.then(() => {
    jobQueue.forEach((job) => job());
  }).finally(() => {
    isFlushing = false;
  });
}
