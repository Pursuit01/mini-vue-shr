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
