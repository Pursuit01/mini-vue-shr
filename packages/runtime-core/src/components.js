import { effect } from "../../reactive/src/effect";
// TODOS: 还需引入 reactive 函数和 patch 函数

function mountComponent(vnode, container, anchor) {
  // 获取组件实例对象
  const componentOption = vnode.type;

  // 从组件实例中解构出 render 渲染函数, data对象, 生命周期钩子（这里假设每个钩子上只注册了一个回调）
  const {
    render,
    data,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
  } = componentOption;

  // 先调用 beforeCreate 钩子
  beforeCreate && beforeCreate();

  // 调用data()函数并使用reactive处理，获取响应式对象state
  const state = reactive(data());

  // 定义一个组件实例，一个组件实际上就是一个对象，它包含了与组件相关的状态信息
  const instance = {
    state,
    isMounted: false, // 是否挂载
    subTree: null, // 子树
  };

  // 在vnode上添加针对组件实例的引用
  vnode.component = instance;

  created && created.call(state);

  // 将组件的render函数放入副作用函数中，这样一旦state变化了，就会重新执行组件的渲染函数，并重新挂载（patch方法）
  effect(
    () => {
      // 将执行render函数，并将this指向state，同时把state作为第一个参数传递到render函数中
      const subTree = render.call(state, state);

      // 如果组件未挂载，调用patch第一个参数传null
      if (!instance.isMounted) {
        // 执行生命周期钩子
        beforeMount && beforeMount.call(state);

        patch(null, subTree, container, anchor);

        // 执行mounted
        mounted && mounted.call(state);

        // 将组件状态更新为已挂载
        instance.isMounted = true;
      } else {
        beforeUpdate && beforeUpdate.call(state);
        // 如果已挂载，对比旧子树 instance.subTree 与新子树 subTree,进行打补丁操作
        patch(instance.subTree, subTree, container, anchor);
        updated && updated.call(state);
      }

      // 更新组件实例的子树
      instance.subTree = subTree;
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
