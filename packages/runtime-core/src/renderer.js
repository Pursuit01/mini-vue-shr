export function createRenderer(options = {}) {
  // 通过 options 得到操作 DOM 的 api
  // 好处就是：它不再直接依赖于浏览器的特有 API 了。这意味着，只要传入不同的配置项，就能够完成非浏览器环境下的渲染工作。
  const { createElement, insert, setElementText } = options;

  function patch(n1, n2, container) {
    if (!n1) {
      // 如果旧节点 n1 不存在，意味着挂载，则调用 mountElement 函数完成挂载
      mountElement(n2, container);
    } else {
      // n1 存在，打补丁
    }
  }

  // 挂载函数
  function mountElement(vnode, container) {
    const { type, children } = vnode;
    // 调用 createElement 创建 DOM 元素
    const el = createElement(type);
    // 处理子节点，如果子节点是字符串，代表元素具有文本节点
    if (typeof children === "string") {
      // 调用 setElementText 设置元素的文本节点
      setElementText(el.tag, children);
    }
    // 调用 insert 函数将元素插入到容器中
    insert(el.tag, container.type);
  }

  // 渲染器的入口
  function render(vnode, container) {
    if (vnode) {
      //如果新节点存在，则旧节点和新节点一起传入 patch 函数，进行打补丁
      patch(container._vnode, vnode, container);
    } else {
      // 如果新节点不存在，旧节点存在，则删除旧节点，即清空 container 的innerHTML
      if (container._vnode) {
        container.innerHTML = "";
      }
    }
    // 把 vnode 存储到 container._vnode 中，即后续渲染中的旧节点
    container._vnode = vnode;
  }
  return {
    render,
  };
}
