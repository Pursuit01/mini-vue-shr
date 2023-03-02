var path = require("path"); // 获取 nodejs 中的 path 对象
var webpack = require("webpack"); // 获取安装好的 webpack 对象
// 输出
module.exports = {
  context: path.resolve(__dirname, "./packages/runtime-core/src"), // 找到项目内的 src 目录
  entry: {
    app: "./renderer.js", // 入口文件
  },
  output: {
    path: path.resolve(__dirname, "./dist"), // 输出文件夹
    filename: "bundle.js", // 输出文件
  },
};
