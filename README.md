# mini-vue-shr

简易版 Vue3 实现，代码是深入阅读 《Vue.js设计与实现》 后的产物，感兴趣的读者可自行参考。测试用例只保证了框架的基本功能，代码问题欢迎PR。

### 开启 vitest

> npm run test

### 已开发功能模块（持续更新中...）

#### 响应式系统

- 副作用函数编写
- computed 计算属性
- watch 监听属性
- reactive
- shallowReactive
- readonly
- shallowReadonly

#### 渲染器

- 实现挂载与更新操作
- 实现虚拟DOM简单diff算法
- 实现虚拟DOM双端diff算法

#### 组件初始化

- 组件生命周期钩子处理
- 组件 setup 函数处理及 props，renderContext 处理
- 组件实例 instance 处理

#### 模板编译器

- parse（通过有限状态自动机构造一个词法分析器，生成模板 AST）
- transform（将 模板 AST 生成JS AST并挂载到 node.jsNode 上）
- generate（代码生成，使用字符串拼接把 node.jsNode 转为渲染函数代码字符串）

#### need marker or review

- set集合的拦截操作
- 事件冒泡与更新时机问题

### 如果对你有帮助,请给个star
