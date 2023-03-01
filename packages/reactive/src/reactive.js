import { createReactive } from "./effect";

export function reactive(data) {
  return createReactive(data);
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
