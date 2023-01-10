import { effect, track, trigger } from "./effect";

// watch的本质还是根据 source 来收集依赖集，只是当 source 中的值变化时，不执行副作用函数，而是执行用户传入的回调 cb
export function watch(source, cb, options = {}) {
  let getter;

  // 兼容传入的 source 为函数（如： () => obj.foo ）的情况
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  // 定义新值与旧值
  let oldValue, newValue;

  // 提取 scheduler 调度函数作为一个独立的job
  const job = () => {
    // 获取副作用函数 effectFn 的执行结果，因为 effectFn 返回的是getter函数的执行结果，即返回 getter 的返回值
    newValue = effectFn();
    // 传入回调
    cb(newValue, oldValue);
    // 使用完旧值后，再更新旧值
    oldValue = newValue;
  };

  // 使用 traverse 函数强行读取一遍source的所有属性，这样在属性修改时，就会执行该回调
  const effectFn = effect(
    // 执行 getter
    () => getter(),
    {
      lazy: true,
      scheduler() {
        // 如果配置项flush = post，则将回调放入微任务队列中，将等待 DOM 更新结束后再执行
        if (options.flush == "post") {
          const p = Promise.resolve();
          p.then(job);
        } else {
          job();
        }
      },
    }
  );

  // 如果 options 传入了 immediate，则立即执行一次回调
  if (options.immediate) {
    // 此时 oldValue 为 null
    job();
  } else {
    // 手动调用副作用函数，拿到的值就是旧值,这里的旧值是供 watch 监听的属性变更时使用的,即第二次执行 job 时
    oldValue = effectFn();
  }
}
function traverse(value, seen = new Set()) {
  // 如果是基本数据类型 或者 为null 或者 已经读取过了，直接return
  if (typeof value != "object" || value === null || seen.has(value)) {
    return;
  }
  // 强行读取一遍value
  seen.add(value);
  // 如果是数组，使用for...of遍历一次
  if (value instanceof Array) {
    for (const it of value) {
      traverse(it, seen);
    }
  } else if (typeof value === "object") {
    // 如果是对象，使用for...in遍历一次
    for (const k in value) {
      traverse(value[k], seen);
    }
  }
  return value;
}
