import { parse } from "./parse";
import { transform } from "./transform";
import { generate } from "./generate";

export function compile(template) {
  // 1. 将模板解析为模板AST
  const ast = parse(template);
  // 2. 将模板AST转换称JS AST，并添加到 node.jsNode 属性上
  transform(ast);
  // 3. 代码生成
  const code = generate(ast.jsNode);
  return code;
}
