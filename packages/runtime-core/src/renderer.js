export function createRenderer(
  options = {
    createElement(tag) {
      // console.log(`创建 ${tag} 元素`);
      // return { tag };
    },
    insert(el, container) {
      // console.log(`将 ${el} 插入到 ${container} 中`);
      // return true;
    },
    setElementText(el, text) {
      // console.log(`将 ${el} 的文本设置为 ${text}`);
      // return;
    },
    patchProps(el, key, oldValue, newValue) {
      // 注意区分 HTML Attributes 和 DOM Properties 的区别
      // 实际上，HTML Attributes 的作用是设置与之对应的 DOM Properties 的初始值。
      // 一旦值改变，那么 DOM Properties 始终存储着当前值，
      // 而通过 getAttribute 函数得到的仍然是初始值。
      // HTML Attributes 的作用是设置与之对应的 DOM Properties 的初始值。

      if (/^on/.test(key)) {
        // 匹配on开头的属性，视其为事件
        const name = key.slice(2).toLowerCase();
        // 如果事件已经注册过，则先卸载
        // oldValue && el.removeEventListener(name, oldValue);
        // 为 name 注册事件
        // el.addEventListener(name, newValue);

        // 优化:
        // 定义el._vei为一个对象,存储事件名称到事件处理函数的映射
        const invokers = el._vei || (el._vei = {});
        let invoker = invokers[key];
        if (newValue) {
          // 如果没有 invoker，则将一个伪造的invoker缓存到 el._vei 上
          if (!invoker) {
            invoker = el._vei[key] = (e) => {
              // 如果事件发生时间早于事件处理函数绑定的事件, 则不执行事件处理函数
              if (e.timeStamp < invoker.attached) return;

              // 当同一时间上含有多个处理函数时, newValue 会是一个数组,此时需要逐一执行
              // 注意这里的 invoker.value 其实等价于 newValue,因为下面会进行赋值操作,而且invoker真正执行实际是在赋值操作之后的
              if (Array.isArray(invoker.value)) {
                invoker.value.forEach((fn) => fn(e));
              } else {
                // 当伪造的事件处理函数执行时，会在其内部间接执行真正的事件处理函数 invoker.value(e)。
                invoker.value(e);
              }
            };
            // 将真正的事件处理函数赋给 .value
            invoker.value = newValue;

            // 添加 invoker.attacched 属性, 存储事件处理函数被绑定的时间
            invoker.attached = performance.now();
            // 绑定invoker作为事件处理函数，这样的好处是当时间更新时，无需进行s事件卸载操作，只需修改 invoker.value 即可。
            el.addEventListener(name, invoker);
          } else {
            // 如果存在说明 invoker.value 存的是之前的事件处理函数, 进行更新
            invoker.value = newValue;
          }
        } else if (invoker) {
          // 新的事件处理函数不存在,且之前绑定的 invoker 存在.则卸载旧的事件
          el.removeEventListener(name, invoker);
          el._vei[key] = null;
        }
      } else if (key === "class") {
        // 对 class 属性进行特殊处理
        el.className = newValue || "";
      } else if (shouldAsProps(el, key, newValue)) {
        const type = typeof el[key];
        // 下面的判断用来处理类似于 disabled 等属性的适配问题，
        // 只要真实 DOM 中存在该属性名，并且vnode的值为空字符，就将该属性设为 true.
        // 这样就可以将 vnode 中的 { props: { disabled: '' } } 转为 el.disabled = true
        if (type === "boolean" && newValue === "") {
          el[key] = true;
        } else {
          el[key] = newValue;
        }
      } else {
        // 如果要设置的属性没有对应的 DOM Properties，则使用 el.setAttribute 设置。
        el.setAttribute(key, newValue);
      }
    },
  }
) {
  // 通过 options 得到操作 DOM 的 api
  // 好处就是：它不再直接依赖于浏览器的特有 API 了。这意味着，只要传入不同的配置项，就能够完成非浏览器环境下的渲染工作。
  const { createElement, insert, setElementText, patchProps } = options;

  function patch(n1, n2, container) {
    if (n1 && n1.type !== n2.type) {
      // 如果旧节点存在并且新旧节点类型不一样，则没有对比的必要。直接卸载旧节点，再通过后续代码挂载新节点
      unmount(n1);
      n1 = null;
    }
    const { type } = n2;
    if (typeof type === "string") {
      // 如果 n2 类型是字符串，则它描述的是普通元素
      if (!n1) {
        // 如果旧节点 n1 不存在，意味着挂载，则调用 mountElement 函数完成挂载
        mountElement(n2, container);
      } else {
        // n1 存在，打补丁
        patchElement(n1, n2);
      }
    } else if (typeof type === "object") {
      // 如果 n2 类型是对象，则它描述的是组件
    } else {
      // 处理其他类型的vnode
    }
  }

  // 挂载函数
  function mountElement(vnode, container) {
    const { type, children } = vnode;
    // 调用 createElement 创建 DOM 元素同时让 vnode.el 引用真实 DOM 元素
    const el = (vnode.el = createElement(type));

    // 处理 DOM 元素的属性
    if (vnode.props) {
      // 遍历每个属性，通过 setAttribute 添加到 DOM 上
      for (const key in vnode.props) {
        // 将属性的设置操作提取到 options 中，根据可以提升不同平台的兼容性
        // patchProps 函数在浏览器平台上的实现原理见函数传参
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    // 扩展: 提前规定子节点 children 的类型有三种: null 为没有子节点  string 为文本子节点  数组 为多个子节点
    // 处理子节点，如果子节点是字符串，代表元素具有文本节点
    if (typeof children === "string") {
      // 调用 setElementText 设置元素的文本节点
      setElementText(el, children);
    } else if (Array.isArray(children)) {
      // 如果子元素是数组，则调用 patch 函数逐个挂载，注意此时的父容器为刚创建的 el.
      children.forEach((child) => {
        patch(null, child, el);
      });
    }
    // 调用 insert 函数将元素插入到容器中
    insert(el, container);
  }

  // 补丁函数
  function patchElement(n1, n2) {
    // 此处n1,n2之所以存在 el 属性,
    // 是因为所有元素在执行 mountElement 首次挂载时,都会为vnode.el指向真实 DOM 元素
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    // 更新props
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null);
      }
    }

    // 更新children
    patchChildren(n1, n2, el);
  }

  // 渲染器的入口
  function render(vnode, container) {
    if (vnode) {
      //如果新节点存在，则旧节点和新节点一起传入 patch 函数，进行打补丁
      patch(container._vnode, vnode, container);
    } else {
      // 如果新节点不存在，旧节点存在，则删除旧节点，即清空 container 的innerHTML
      if (container._vnode) {
        unmount(container._vnode);
      }
    }
    // 把 vnode 存储到 container._vnode 中，即后续渲染中的旧节点
    container._vnode = vnode;
  }

  /**
   * 好处：1 在 unmount 函数内，我们有机会调用绑定在 DOM 元素上的指令钩子函数，例如 beforeUnmount、unmounted 等。
   *      2 当 unmount 函数执行时，我们有机会检测虚拟节点 vnode 的类型。
   *      3 如果该虚拟节点描述的是组件，则我们有机会调用组件相关的生命周期函数。
   * @param {*} vnode
   */
  // 卸载操作较为常用，单独提取出来封装一下
  function unmount(vnode) {
    // 根据 vnode 获取要卸载的真实 DOM 元素
    const el = vnode.el;
    // 获取 el 的父元素
    const parent = el.parentNode;
    // 调用 removeChild 移除元素
    if (parent) parent.removeChild(el);
  }

  return {
    render,
    unmount,
  };
}

// 对模板中传入的 class 进行特殊处理
export function normalizeClass(classList) {
  let res = "";
  classList.forEach((item) => {
    if (typeof item === "string") {
      let temp = item.split(" ");
      temp.forEach((v) => {
        res += `${v} `;
      });
    } else if (typeof item === "object") {
      for (const key in item) {
        if (item[key] === true) {
          res += `${key} `;
        }
      }
    }
  });
  return res.trim();
}

// 代表属性是否应该作为 DOM Properties 被设置。
function shouldAsProps(el, key, value) {
  // 特殊处理
  if (key === "form" && el.tagName === "INPUT") return false;
  // 兜底
  return key in el;
}
