export function transform(ast) {
  // 创建转换上下文对象，用来存储当前节点相关信息和常规操作
  const context = {
    childIndex: 0, // 当前节点在父节点的 children 中的位置索引
    parent: null, // 当前转换节点的父节点
    currentNode: null, // 当前正在转换的节点
    nodeTransforms: [transformElement, transformText],
    // replaceNode 用于替换节点的函数，接收新节点作为参数
    replaceNode(node) {
      // 使用新节点替换旧节点
      context.parent.children[context.childIndex] = node;
      // 更新 context 对象，使 context.currentNode 指向新节点
      context.currentNode = node;
    },
    // removeNode 用于移除当前节点
    removeNode() {
      if (context.parent) {
        context.parent.children.splice(context.parent.childIndex, 1);
        context.currentNode = null;
      }
    },
  };

  // 调用traverseNode完成转换
  traverseNode(ast, context);
  // 打印ast信息
  dump(ast);
}

// dump函数：用来打印当前AST中节点的信息
export function dump(node, indent = 0) {
  // 定义节点类型，如果为根节点则为空
  const type = node.type;

  // 定义节点的描述
  // 如果为Element，则用node.tag作为描述； 如果是Text，则用node.content作为描述
  const desc =
    node.type === "Root"
      ? ""
      : node.type === "Element"
      ? node.tag
      : node.content;
  console.log(`${"-".repeat(indent)} ${type}: ${desc}`);
  if (node.children) {
    node.children.forEach((child) => {
      dump(child, indent + 2);
    });
  }
}

// 以深度优先的方式 实现对AST中节点的访问
// context 参数实现对节点的操作和访问进行解耦
export function traverseNode(ast, context) {
  context.currentNode = ast;

  // context.nodeTransforms 是一个数组，其中每个元素都是一个函数
  const transforms = context.nodeTransforms;
  for (let i = 0; i < transforms.length; i++) {
    // 将当前节点currentNode 和 context 都传递给 nodeTransforms 中注册的回调函数
    transforms[i](context.currentNode, context);

    // 如果执行完某次转换函数后，当前节点不存在了，那么后续的转换函数就不需要再执行，直接 return
    if (!context.currentNode) return;
  }
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      context.parent = context.currentNode;
      context.childIndex = i;
      traverseNode(children[i], context);
    }
  }
}

function transformElement(node) {
  if (node.type === "Element" && node.tag === "p") {
    node.tag = "h1";
  }
}
function transformText(node, context) {
  if (node.type === "Text") {
    // node.content = node.content.repeat(2);
    // 1. 调试 context.replaceNode 功能，用于替换文本节点
    // context.replaceNode({
    //   type: "Element",
    //   tag: "span",
    // });
    // 2. 调试 context.removeNode 功能，用于移除文本节点
    // context.removeNode();
  }
}
