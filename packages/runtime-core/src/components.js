import { effect } from "../../reactive/src/effect";
function mountComponent(vnode, container, anchor) {
  // 获取组件实例对象
  const componentOption = vnode.type;

  // 从组件实例中解构出render渲染函数 和 data对象
  const { render, data } = componentOption;

  // 调用data()函数并使用reactive处理，获取响应式对象state
  const state = reactive(data());

  // 将组件的render函数放入副作用函数中，这样一旦state变化了，就会重新执行组件的渲染函数，并重新挂载（patch方法）
  effect(
    () => {
      // 将执行render函数，并将this指向state，同时把state作为第一个参数传递到render函数中
      const subTree = render.call(state, state);
      patch(null, subTree, container, anchor);
    },
    {
      // 确保多次修改相应是数据时，只执行一次副作用函数。
      scheduler: queueJob,
    }
  );
}

const queue = new Set();
const p = Promise.resolve();
let isFlushing = false;
function queueJob(job) {
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      try {
        queue.forEach((job) => job());
      } finally {
        isFlushing = false;
        queue.clear = 0;
      }
    });
  }
}
