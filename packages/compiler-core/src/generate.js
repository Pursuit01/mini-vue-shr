export function generate(node) {
  const context = {
    // 存储最终生成的渲染函数代码
    code: "",
    // 在生成代码时， 通过调用push函数完成代码的拼接
    push(code) {
      context.code += code;
    },
    // 当前缩进级别，初始值为0，即没有缩进
    currentIndent: 0,
    newLine() {
      context.code += "\n" + `  `.repeat(context.currentIndent);
    },
    // 缩进函数，让currentIndent自增后，调用换行函数
    indent() {
      context.currentIndent++;
      context.newLine();
    },
    // 取消缩进函数，让currentIndent自减后，调用换行函数
    deIndent() {
      context.currentIndent--;
      context.newLine();
    },
  };
  // 调用 genNode 函数完成代码生成的工作
  genNode(node, context);
  return context.code;
}

// 在代码生成函数内部，根据不同的节点类型，调用对应的生成器函数
function genNode(node, context) {
  switch (node.type) {
    case "FunctionDecl":
      genFunctionDecl(node, context);
      break;
    case "ReturnStatement":
      genReturnStatement(node, context);
      break;
    case "CallExpression":
      genCallExpression(node, context);
      break;
    case "StringLiteral":
      genStringLiteral(node, context);
      break;
    case "ArrayExpression":
      genArrayExpression(node, context);
      break;
  }
}

// 函数声明语句的代码生成
function genFunctionDecl(node, context) {
  const { push, indent, deIndent } = context;
  push(`function ${node.id.name} `);
  push(`(`);

  // 调用 genNodeList 生成函数的参数列表
  genNodeList(node.params, context);
  push(`) `);
  push(`{`);
  indent();
  node.body.forEach((n) => genNode(n, context));
  deIndent();
  push(`}`);
}

// 函数返回值语句的代码生成
function genReturnStatement(node, context) {
  const { push } = context;
  push(`return `);
  genNode(node.return, context);
}

// 函数调用语句的代码生成
function genCallExpression(node, context) {
  const { push } = context;
  const { callee, arguments: args } = node;
  push(`${callee.name} (`);
  genNodeList(args, context);
  push(`) `);
}

// 字符串声明的代码生成
function genStringLiteral(node, context) {
  const { push } = context;
  push(`'${node.value}'`);
}

// 数组表达式的代码生成
function genArrayExpression(node, context) {
  const { push } = context;
  push(`[`);
  genNodeList(node.elements, context);
  push(`]`);
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    genNode(node, context);
    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}
