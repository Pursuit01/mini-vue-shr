import {
  createArrayExpression,
  createCallExpression,
  createIdentifier,
  createStringLiteral,
} from "./util";

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

  // 增加退出阶段的回调函数数组
  const exitFns = [];

  // context.nodeTransforms 是一个数组，其中每个元素都是一个函数
  const transforms = context.nodeTransforms;
  for (let i = 0; i < transforms.length; i++) {
    // 将当前节点currentNode 和 context 都传递给 nodeTransforms 中注册的回调函数
    // transforms[i](context.currentNode, context);
    // 将退出阶段的回调函数添加到 exitFns 数组中
    const onExit = transforms[i](context.currentNode, context);
    if (onExit) {
      exitFns.push(onExit);
    }

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
  // 在节点处理的最后阶段执行缓存到 exitFns 的回调函数
  // 注意，这里要反序执行，这样才能保证执行当前节点的转换函数时，其所有子节点的转换函数已经全部执行过了。
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function transformElement(node) {
  // 处理转换函数的工作流，返回一个会在退出阶段执行的回调函数
  return () => {
    if (node.type !== "Element") return;
    const callExp = createCallExpression("h", [createStringLiteral(node.tag)]);
    node.children.length === 0
      ? callExp.arguments.push(node.children[0].jsNode)
      : callExp.arguments.push(
          createArrayExpression(node.children.map((n) => n.jsNode))
        );
    node.jsNode = callExp;
    // if (node.type === "Element" && node.tag === "p") {
    //   node.tag = "h1";
    // }
  };
}
function transformText(node, context) {
  return () => {
    if (node.type !== "Text") return;
    node.jsNode = createStringLiteral(node.content);
    // node.content = node.content.repeat(2);
    // 1. 调试 context.replaceNode 功能，用于替换文本节点
    // context.replaceNode({
    //   type: "Element",
    //   tag: "span",
    // });
    // 2. 调试 context.removeNode 功能，用于移除文本节点
    // context.removeNode();
  };
}
function transformRoot(node) {
  return () => {
    if (node.type !== "Root") return;
    const vnodeJSAST = node.children[0].jsNode;
    node.jsNode = {
      type: "FunctionDecl",
      id: createIdentifier("render"),
      params: [],
      body: [
        {
          type: "ReturnStatement",
          return: vnodeJSAST,
        },
      ],
    };
  };
}
