// 用于在代理对象上获取原始对象
export const RAW = "raw";

// 用于跟踪 for...in 对应的依赖
export const ITERATE_KEY = Symbol();

// 判断对对象上属性的操作类型
export const TriggerType = {
  SET: "SET",
  ADD: "ADD",
  DELETE: "DELETE",
};
