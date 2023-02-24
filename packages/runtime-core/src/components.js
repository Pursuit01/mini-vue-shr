import { effect } from "../../reactive/src/effect";
// TODOS: 还需引入 reactive, patch, shallowReactive,shallowReadonly

// 存储当前正在被初始化的实例对象
let currentInstance = null;

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
    props: propsOption,
    setup,
  } = componentOption;

  // 调用data()函数并使用reactive处理，获取响应式对象state
  const state = data ? reactive(data()) : null;
  // 解析props和attrs
  const [props, attrs] = resolveProps(propsOption, vnode.props);

  // 定义emit函数
  function emit(event, ...payload) {
    const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
    const handler = instance.props[eventName];
    if (handler) {
      handler(...payload);
    } else {
      console.error("事件不存在");
    }
  }
  // 定义插槽对象
  const slots = vnode.children || {};

  // 定义一个组件实例，一个组件实际上就是一个对象，它包含了与组件相关的状态信息
  const instance = {
    state,
    isMounted: false, // 是否挂载
    subTree: null, // 子树
    props: shallowReactive(props), // 组件props，浅响应
    slots,
    mounted: [],
    beforeMount: [],
    beforeUpdate: [],
    updated: [],
    beforeUnmount: [],
    onUnmounted: [],
  };
  // 在setup函数执行之前设置当前组件实例
  setCurrentInstance(instance);

  // 定义setup函数的上下文对象，作为第二个参数传入
  const setupContext = {
    attrs,
    emit,
    slots,
  };
  // 调用setup函数，并传递 props 和 setupContext
  const setupResult = setup(shallowReadonly(props), setupContext);

  // setup执行完后，重置当前组件实例
  setCurrentInstance(null);

  // 存储setup返回的数据
  let setupState = null;
  if (typeof setupResult == "function") {
    if (render) {
      console.error("setup返回函数，render选项将被忽略");
    } else {
      // 如果 setup 返回值不是函数，则作为数据状态赋给 setupState
      setupState = setupResult;
    }
  }

  // 先调用 beforeCreate 钩子
  beforeCreate && beforeCreate();

  // 在vnode上添加针对组件实例的引用
  vnode.component = instance;

  // 创建一个渲染上下文对象，本质是对组件实例的代理
  // 它的意义在于拦截数据状态的读取和设置操作，每当在渲染函数或生命周期钩子中通过 this 来读取数据时，都会优先从组件的自身状态中读取，
  // 如果组件本身并没有对应的数据，则再从 props 数据中读取。
  const renderContext = new Proxy(instance, {
    get(t, k, r) {
      const { state, props } = t;
      if (state && k in state) {
        return Reflect.get(state, k);
      } else if (props && k in props) {
        return Reflect.get(props, k);
      } else if (setupState && k in setupState) {
        // 渲染上下文需要增加对 setupState 的支持
        return Reflect.get(setupState, k);
      } else if (k == "$slots") {
        return slots;
      } else {
        console.log("属性不存在");
      }
    },
    set(t, k, v, r) {
      const { state, props } = t;
      if (state && k in state) {
        Reflect.set(state, k, v);
      } else if (props && k in props) {
        console.warn(`子组件无法修改父组件的props ${k}`);
      } else if (setupState && k in setupState) {
        Reflect.set(setupState, k, v);
      } else {
        console.log("属性不存在");
      }
    },
  });

  created && created.call(renderContext);

  // 将组件的render函数放入副作用函数中，这样一旦state变化了，就会重新执行组件的渲染函数，并重新挂载（patch方法）
  effect(
    () => {
      // 将执行render函数，并将this指向state，同时把state作为第一个参数传递到render函数中
      const subTree = render.call(renderContext, state);

      // 如果组件未挂载，调用patch第一个参数传null
      if (!instance.isMounted) {
        // 执行生命周期钩子
        beforeMount && beforeMount.call(renderContext);
        instance.beforeMount && instance.beforeMount.forEach((fn) => fn());

        patch(null, subTree, container, anchor);

        // 执行mounted
        instance.mounted && instance.mounted.forEach((fn) => fn());
        mounted && mounted.call(renderContext);

        // 将组件状态更新为已挂载
        instance.isMounted = true;
      } else {
        instance.beforeUpdate && instance.beforeUpdate.forEach((fn) => fn());
        beforeUpdate && beforeUpdate.call(renderContext);
        // 如果已挂载，对比旧子树 instance.subTree 与新子树 subTree,进行打补丁操作
        patch(instance.subTree, subTree, container, anchor);
        instance.updated && instance.updated.forEach((fn) => fn());
        updated && updated.call(renderContext);
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
/**
 * 判断 propsData 的 key 是否存在于 propsOption 上，存在则属于 props ，不存在则是 attrs
 * @param {*} propsOption 组件内声明的props选项
 * @param {*} propsData 组件实例上传递的props数据
 * @returns [props, attrs]
 */
function resolveProps(propsOption, propsData) {
  const props = {};
  const attrs = {};
  for (const key in propsData) {
    // 只要以on开头的属性，都作为props处理（这里默认在处理模板时，将事件前的 @ 符转为 on 了）
    if (key in propsOption || key.startsWith("on")) {
      props[key] = propsData[key];
    } else {
      attrs[key] = propsData[key];
    }
  }
  return [props, attrs];
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}

function onMounted(fn) {
  if (currentInstance) {
    currentInstance.mounted.push(fn);
  } else {
    console.error("onMounted 函数只能在 setup 中调用");
  }
}
function onBeforeMount(fn) {
  if (currentInstance) {
    currentInstance.beforeMount.push(fn);
  } else {
    console.error("onBeforeMount 函数只能在 setup 中调用");
  }
}
function onUpdated(fn) {
  if (currentInstance) {
    currentInstance.updated.push(fn);
  } else {
    console.error("onUpdated 函数只能在 setup 中调用");
  }
}
function onBeforeUpdate(fn) {
  if (currentInstance) {
    currentInstance.beforeUpdate.push(fn);
  } else {
    console.error("onBeforeUpdate 函数只能在 setup 中调用");
  }
}
function onUnmounted(fn) {
  if (currentInstance) {
    currentInstance.unmounted.push(fn);
  } else {
    console.error("onUnmounted 函数只能在 setup 中调用");
  }
}
function onBeforeUnmount(fn) {
  if (currentInstance) {
    currentInstance.beforeUnmount.push(fn);
  } else {
    console.error("onBeforeUnmount 函数只能在 setup 中调用");
  }
}
