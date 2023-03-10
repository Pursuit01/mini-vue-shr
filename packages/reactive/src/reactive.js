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

export function ref(val) {
  const wrapper = {
    value: val,
  };
  // 使用 Object.defineProperty 在 wrapper 对象上定义一个不可枚举的 __v_isRef，并且值为true
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  });
  return reactive(wrapper);
}

export function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(val) {
      obj[key] = val;
    },
  };
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  });
  return wrapper;
}

export function toRefs(obj) {
  const ret = {};
  // 使用for...in遍历对象
  for (const key in obj) {
    // 逐个调用 toRef 完成转换
    ret[key] = toRef(obj, key);
  }
  return ret;
}

// 使模板中的属性自动脱ref
/**
 * proxyRefs 会判断当前属性是否是一个 ref 类型，如果是就自动调用 .value 属性获取数据；
 * 如果更改的是 ref 类型，则自动更改它的 .value 属性。
 * @param {*} target
 * @returns
 */
export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = target[key];
      return value.__v_isRef ? value.value : value;
    },
    set(target, key, newValue, receiver) {
      const val = Reflect.get(target, key, receiver);
      if (val.__v_isRef) {
        val.value = newValue;
        return true;
      } else {
        return Reflect.set(target, key, newValue, receiver);
      }
    },
  });
}
