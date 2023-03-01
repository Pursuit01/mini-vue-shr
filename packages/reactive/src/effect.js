import { RAW, ITERATE_KEY, TriggerType } from "./const";
import { reactive, readonly } from "./reactive";
// WeakMap优点：一旦 target 被 GC，weakmap 的 key 和 value 就都访问不到了，防止内存泄漏
/**
 * new WeakMap()
 *    |
 *   target--- new Map
 *                |
 *               key----new Set() set集合用来存储与属性相关的副作用函数，可以自动去除相同的依赖函数
 */
const bucket = new WeakMap();

// 全局变量用来存储 副作用函数
let activeEffect = null;

// 定义 effect 栈，用于解决副作用函数嵌套的情况，activeEffect 始终指向栈顶元素
let effectStack = [];

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

export function trigger(target, key, type) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  // 取得与 key 相关联的副作用函数
  const effects = depsMap.get(key);

  // 将 effects 拷贝一份再遍历，防止 forEach 时出现 栈溢出
  // const effectsToRun = new Set(effects);
  const effectsToRun = new Set();

  // 当新增属性时，执行与 ITERATE_KEY 相关联的副作用函数
  if (type == TriggerType.ADD || type == TriggerType.DELETE) {
    // 取得与 ITERATE_KEY 相关联的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY);
    // 将与 ITERATE_KEY 相关联的副作用函数添加到 effectsToRun
    iterateEffects &&
      iterateEffects.forEach((fn) => {
        if (fn !== activeEffect) {
          effectsToRun.add(fn);
        }
      });
  }

  // 将与 key 相关联的副作用函数添加到 effectsToRun
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

// 响应式函数
export function createReactive(data, isShallow = false, isReadonly = false) {
  return new Proxy(data, {
    // 拦截属性的读取操作
    get(target, key, receiver) {
      // 允许代理对象通过 raw 属性获取原始对象
      if (key == RAW) {
        return target;
      }

      // 非只读时才需要建立响应联系
      if (!isReadonly) {
        // 追踪属性读取操作
        track(target, key);
      }
      const res = Reflect.get(target, key, receiver);

      // 如果是浅响应，直接返回原始值
      if (isShallow) {
        return res;
      }
      // 如果对象的属性仍是对象，则递归调用reactive，返回深层次的响应式对象
      if (typeof res === "object" && res !== null) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      if (isReadonly) {
        console.warn(`属性 ${key} 是只读的`);
        return true;
      }
      // 获取旧值
      const oldVal = target[key];
      // 判断是 新增属性 还是 修改属性
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;

      const res = Reflect.set(target, key, value, receiver);
      if (receiver.raw === target) {
        // 属性被修改时(旧值与新值不同 或者 二者不都是NaN时)，触发追踪的副作用函数重新执行
        if (oldVal !== value && (oldVal === oldVal || value === value)) {
          trigger(target, key, type);
        }
      }
      return res;
    },
    // 用于拦截 in 操作
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    // 用于拦截for...in
    ownKeys(target) {
      // 将副作用函数与 ITERATE_KEY 关联
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target, ITERATE_KEY);
    },
    // 用于拦截属性删除操作
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`属性 ${key} 是只读的`);
        return true;
      }
      // 判断 key 是否 target 自身上的属性
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      // 判断是否删除成功
      const res = Reflect.deleteProperty(target, key);
      if (res && hadKey) {
        // 只有当删除成功且是自己的属性时，才触发更新
        trigger(target, key, TriggerType.DELETE);
      }
      return res;
    },
  });
}
