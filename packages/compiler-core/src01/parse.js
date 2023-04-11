// 维护一个状态表，表示文本模式
const TextModes = {
  DATA: "DATA",
  RCDATA: "RCDATA",
  RAWTEXT: "RAWTEXT",
  CDATA: "CDATA",
};

function parse(str) {
  const context = {
    // 模板内容，用于在解析过程中进行消费
    source: str,
    // 解析器当前处于文本模式，初始模式为DATA
    mode: TextModes.DATA,
  };
  // 参数1：上下文对象
  // 参数2：由父代节点构成的节点栈，用于维护节点间的父子级关系，初始时栈为空
  const nodes = parseChildren(context, []);
  // 返回根节点的模板AST
  return {
    type: "Root",
    childrem: nodes,
  };
}

function parseChildren(context, ancestors) {
  // 定义 nodes 存储子节点，将它作为最终的返回值
  const nodes = [];
  // 获取上下文对象的 mode 和 source
  const { mode, source } = context;
  // 开启while循环
  // isEnd 函数待定
  while (!isEnd(context, ancestors)) {
    let node;

    // 只有 DATA 和 RCDATA 模式才支持插值节点的解析
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 只有 DATA 模式才支持标签节点的解析
      if (mode === TextModes.DATA && source[0] === "<") {
        if (source[1] === "!") {
          if (source.startsWith("<!--")) {
            // 注释节点
            node = parseComment(context);
          } else if (source.startsWith("<![CDATA[")) {
            // CDATA
            node = parceCDATA(context, ancestors);
          }
        } else if (source[1] === "/") {
          // 结束标签，这里需要抛出错误
        } else if (/[a-z]/i.test(source[1])) {
          // 标签
          node = parseElement(context, ancestors);
        }
      } else if (source.startsWith("{{")) {
        // 解析插值
        node = parseInterpolation(context);
      }
    }

    // 如果node不存在，说明处于其他模式，即非 DATA 和非 RCDATA 模式
    if (!node) {
      // 解析文本节点
      node = parseText(context);
    }
    // 将节点加入到 nodes 数组中
    nodes.push(node);
  }
  // while 循环结束，说明子节点解析完毕，返回子节点数组
  return nodes;
}
