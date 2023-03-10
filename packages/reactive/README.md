### 思考 Reactive API 与副作用函数 effect 之间的联系

#### 步骤/流程

 1. 使用reactive API定义一个响应式对象
 2. 调用createReactive函数
 3. 会返回基于该对象的一个代理对象，同时监听当前对象的get，set等操作
 4. 当在effect副作用函数中使用该响应式对象时，
   a. 会把当前副作用函数赋给activeEffect
   b. 会调用track函数，将当前副作用函数activeEffect加入到bucket中
 5. 当响应式数据修改时，会被代理对象的set拦截器捕获，从而触发trigger函数
 6. 这时会把与该属性相关的副作用函数都拿出来执行一遍，其中就包括之前通过effect函数注册的副作用函数。

#### 总结

在上面的场景中，effect函数的作用是注册副作用函数，即向bucket中添加依赖.
如果只用reactive API定义响应式数据，但没有effect向bucket中添加依赖，那么修改数据后，trigger函数从bucket中就取不到副作用函数，也就无法二次执行副作用函数, 不会进行vue中类似于组件更新之类的操作。
基于此才可以理解 effect 是响应式系统的核心，虽然定义响应式数据的时候没用到它，但触发依赖时需要执行由它向桶中加入的副作用函数。
