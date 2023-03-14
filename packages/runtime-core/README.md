## 简单Diff算法

### 介绍

为了以最小的性能开销完成新旧节点的更新操作。操作DOM的开销通常较大，所以diff算法主要利用虚拟节点的key属性，用来找到可复用的节点，通过移动的方式来更新它们。

> 在进行新旧两组子节点更新时，不能只遍历新的一组子节点或旧的一组，应该遍历长度较短的一组子节点，尽可能多的调用patch函数进行更新。

```javascript
01 function patchChildren(n1, n2, container) {
02   if (typeof n2.children === 'string') {
03     // 省略部分代码
04   } else if (Array.isArray(n2.children)) {
05     const oldChildren = n1.children
06     const newChildren = n2.children
07     // 旧的一组子节点的长度
08     const oldLen = oldChildren.length
09     // 新的一组子节点的长度
10     const newLen = newChildren.length
11     // 两组子节点的公共长度，即两者中较短的那一组子节点的长度
12     const commonLength = Math.min(oldLen, newLen)
13     // 遍历 commonLength 次
14     for (let i = 0; i < commonLength; i++) {
15       patch(oldChildren[i], newChildren[i], container)
16     }
17     // 如果 newLen > oldLen，说明有新子节点需要挂载
18     if (newLen > oldLen) {
19       for (let i = commonLength; i < newLen; i++) {
20         patch(null, newChildren[i], container)
21       }
22     } else if (oldLen > newLen) {
23       // 如果 oldLen > newLen，说明有旧子节点需要卸载
24       for (let i = commonLength; i < oldLen; i++) {
25         unmount(oldChildren[i])
26       }
27     }
28   } else {
29     // 省略部分代码
30   }
31 }
```

### key的作用

**场景：**假设更新前有三个子节点1，2，3；更新后变成了3，1，2；如果使用传统的方法，由于旧节点和新节点不同，每次更新都会先卸载旧节点，再挂载新节点，每个节点都无法复用，因此需要6次DOM操作才能完成子节点的更新。<br />但是通过观察可以看出子节点只是顺序变化了，最优解应该是**通过DOM的移动完成子节点的更新**。但必须有一个前提：新旧节点确实存在可复用的节点。那么**如何判断新旧节点是否是同一个节点**呢？这时key的作用就体现出来了。key可以理解为虚拟节点的唯一标识，在源码中是通过type和key来判断旧节点是否可以被复用。

此外，可复用并不意味着不需要更新，对于这两个虚拟节点`{type: 'div', key: 1, children: '123'}`和 `{type: 'div', key: 1, children: '456'}`，虽然DOM可复用。但他们的内容发生了变化，所以在移动DOM之前仍需要打补丁操作，将旧节点的内容进行更新。

### 如何判断节点是否需要移动？

**过程：**首先遍历新的一组子节点，如果旧节点的索引值大于当前寻找过程中最大的索引值`lastIndex`，说明不需要移动，如果旧节点的索引值小于`lastIndex`，说明需要移动。

**原理：**新节点的遍历在外层，所以新节点的索引值一定是递增的，此时如果寻找到的可复用旧节点的索引值存在递减的情况，即旧节点的索引值小于`lastIndex`，就说明旧节点位于当前新节点的前面，需要移动到新节点的后面。

### 如何移动元素？

先获取新节点的前一个DOM元素`prevVNode.el`，获取该元素的后一个元素`prevVNode.el.nextSibling`作为锚点，这里先获取前一个元素，然后再获取这个前一个元素的后一个元素的原因在于，**在新节点遍历的时候，只能确定当前节点对应真实DOM的前一个元素**`**prevVNode.el**`**是处在正确位置的，所以通过**`**prevVNode.el.nextSibling**`**再根据前一个节点**`**prevVNode.el**`**获取旧节点列表中的后一个元素作为锚点，才能插入到正确的位置**。<br />_prevNode是根据新的虚拟节点列表获取的，而nextSibling是通过旧的真实节点列表获取的。_

```javascript
01 function patchChildren(n1, n2, container) {
02   if (typeof n2.children === 'string') {
03     // 省略部分代码
04   } else if (Array.isArray(n2.children)) {
05     const oldChildren = n1.children
06     const newChildren = n2.children
07
08     let lastIndex = 0
09     for (let i = 0; i < newChildren.length; i++) {
10       const newVNode = newChildren[i]
11       let j = 0
12       for (j; j < oldChildren.length; j++) {
13         const oldVNode = oldChildren[j]
14         if (newVNode.key === oldVNode.key) {
15           patch(oldVNode, newVNode, container)
16           if (j < lastIndex) {
17             // 代码运行到这里，说明 newVNode 对应的真实 DOM 需要移动
18             // 先获取 newVNode 的前一个 vnode，即 prevVNode
19             const prevVNode = newChildren[i - 1]
20             // 如果 prevVNode 不存在，则说明当前 newVNode 是第一个节点，它不需要移动
21             if (prevVNode) {
22               // 由于我们要将 newVNode 对应的真实 DOM 移动到 prevVNode 所对应真实 DOM 后面，
23               // 所以我们需要获取 prevVNode 所对应真实 DOM 的下一个兄弟节点，并将其作为锚点
24               const anchor = prevVNode.el.nextSibling
25               // 调用 insert 方法将 newVNode 对应的真实 DOM 插入到锚点元素前面，
26               // 也就是 prevVNode 对应真实 DOM 的后面
27               insert(newVNode.el, container, anchor)
28             }
29           } else {
30             lastIndex = j
31           }
32           break
33         }
34       }
35     }
36
37   } else {
38     // 省略部分代码
39   }
40 }
```

### 总结

**简单diff算法的核心逻辑：**

1. 拿新的一组子节点中的节点去旧的一组子节点中寻找可复用的节点。如果找到了，则记录该节点的位置索引，我们把这个索引成为最大索引；在寻找过程中，如果一个结点的索引值小于最大索引，则说明该节点对应的真实DOM需要移动。
2. 如果在旧的一组子节点中找不到该节点，则对新节点执行挂载操作；
3. 最后拿旧的一组子节点中的节点去新的一组子结点中寻找不存在的节点，执行卸载操作。

## 双端Diff算法

### 介绍

双端 Diff 算法是一种同时对新旧两组子节点的两个端点进行比较的算法。因此，我们需要四个索引值，分别指向新旧两组子节点的端点。

```javascript
01 function patchKeyedChildren(n1, n2, container) {
02   const oldChildren = n1.children
03   const newChildren = n2.children
04   // 四个索引值
05   let oldStartIdx = 0
06   let oldEndIdx = oldChildren.length - 1
07   let newStartIdx = 0
08   let newEndIdx = newChildren.length - 1
09   // 四个索引指向的 vnode 节点
10   let oldStartVNode = oldChildren[oldStartIdx]
11   let oldEndVNode = oldChildren[oldEndIdx]
12   let newStartVNode = newChildren[newStartIdx]
13   let newEndVNode = newChildren[newEndIdx]
14 }
```

### 原理

在双端比较中，每一轮比较都分为四个步骤。

- 比较**旧的一组子节点中第一个节点**和**新的一组子节点中第一个节点**，看看他们是否相同（可复用）。
  - 节点在旧的顺序和新的顺序中都是头部节点，所以**不需要移动节点**，只需打补丁。
  - 打完补丁后，还需更新索引值，将`oldStartVNode = oldChildren[++oldStartIdx]`，`newStartVNode = newChildren[++newStartIdx]`
- 比较**旧的一组子节点中最后一个节点**和**新的一组子节点中最后一个节点**，看看他们是否相同（可复用）。
  - 节点在旧的顺序和新的顺序中都处于最后，所以**不需要移动节点**，只需打补丁。
  - 打完补丁后，还需更新索引值，将`oldEndVNode = oldChildren[--oldEndIdx]`，`newEndVNode = newChildren[--newEndIdx]`
- 比较**旧的一组子节点中第一个节点**和**新的一组子节点中最后一个节点**，看看它们是否相同（可复用）。
  - 打完补丁后，将旧的一组子节点的头部节点对应的真实DOM节点 移动到 **旧的一组子节点的最后一个节点**对应的真实DOM节点 后面。移动DOM后，还需要更新索引值：将 `oldStartVNode = oldChildren[++oldStartIdx]`，`newEndVNode = newChildren[--newEndIdx]`
- 比较**旧的一组子节点中最后一个节点**和**新的一组子节点中第一个节点**，看看他们是否相同（可复用）。
  - 如果可复用，**说明节点原本是最后一个子节点，但在新的顺序中，它变成了第一个子节点**。所以打完补丁以后要**将索引oldEndIdx 指向的虚拟节点所对应的真实 DOM 移动到索引 oldStartIdx 指向的虚拟节点所对应的真实 DOM 前面**。
  - 移动DOM后，还需要更新索引值：将 `oldEndVNode = oldChildren[--oldEndIdx]`，`newStartVNode = newChildren[++newStartIdx]`

如果在以上四个步骤都无法找到可复用的节点，则进行以下处理：

- 遍历旧的一组子节点，尝试在其中寻找与新的一组子节点的头部节点具有相同key的节点，并将该索引存储到`idxInOld`中，先调用path打补丁，然后将旧的一组子节点中索引为`idxInOld`的DOM移动到旧的一组子节点的头部节点之前。
  - 如果处于`idxInOld`的节点已经处理过了，因此将`oldChildren[idxInOld] = undefined`。
  - 新的一组子节点中的头部节点已经处理完毕，所以将`newStartVNode = newChildren[++newStartIdx]`

### 添加新元素 和 移除不存在的元素

在while循环结束后，额外添加两个分支处理添加和移除元素的操作。![image.png](https://cdn.nlark.com/yuque/0/2023/png/23035706/1678779271580-a0cd677e-d613-4d3b-bd1e-e634b7e56717.png#averageHue=%23f7f6f6&clientId=u953965b8-2b9b-4&from=paste&height=311&id=u4d73586a&name=image.png&originHeight=439&originWidth=918&originalType=binary&ratio=1&rotation=0&showTitle=false&size=64651&status=done&style=shadow&taskId=u949d48e7-d805-46e3-bf18-6dc674d2c54&title=&width=650)<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/23035706/1678779314068-fb03b930-e0ec-4c04-9293-c01df3255444.png#averageHue=%23f4f4f4&clientId=u953965b8-2b9b-4&from=paste&height=272&id=ucfa37048&name=image.png&originHeight=355&originWidth=855&originalType=binary&ratio=1&rotation=0&showTitle=false&size=58841&status=done&style=shadow&taskId=u3994eaa9-5a53-497e-a2d3-6811c00ffcd&title=&width=655)

```javascript
01 while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
02   // 省略部分代码
03 }
04
05 if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
    // 添加新节点
06   // 如果满足条件，则说明有新的节点遗留，需要挂载它们
08   for (let i = newStartIdx; i <= newEndIdx; i++) {
09     patch(null, newChildren[i], container, oldStartVNode.el)
10   }
08 } else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
09   // 移除操作
10   for (let i = oldStartIdx; i <= oldEndIdx; i++) {
11     unmount(oldChildren[i])
12   }
13 }

```
