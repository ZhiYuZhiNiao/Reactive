/* 
  effect直译就是 副作用 ，主要和响应式的对象结合使用，响应式对象更新触发effect更新，也可以理解为就是依赖
  一个个 effect 存储在了 dep 集合里面


  调用effect创建ReactiveEffect 类即创建依赖。
  ReactiveEffect 执行run方法时设置，当前实例this到全局activeEffect 方便后面收集依赖。
*/



import { createDep } from './dep'


function effect(fn, options = {}) {
  
}

let activeEffect = undefined // 当前正在运行的effect
let shouldTrack = false // 是否可以收集依赖

// effect实现类
class ReactiveEffect {
  #parent // 父级effect,也即运行当前effect时的外层effect
  #active = true // effect是否是激活状态
  
  constructor(fn, scheduler) {
    this.fn = fn // effect 里面真正的核心实体
    this.scheduler = scheduler // 调度器， 先忽略
    this.deps = [] // effect对应的dep, 即effect被哪些dep收集过
    this.onStop = undefined // 停止时触发的钩子
  }

  // 更新
  run() {
     // 非激活状态，执行 fn 但是不收集依赖
     if (!this.#active) {
      return this.fn()
     }

     // 存储上一个 shouldTrack 和 activeEffect 的值
     const prevShouldTrack = shouldTrack
     this.#parent = activeEffect

    // 执行 fn  收集依赖
    // 可以开始收集依赖了
    shouldTrack = true

    // 执行的时候将当前的 effect 赋值给全局的 activeEffect 
    // 利用全局属性来获取当前的 effect
    activeEffect = this

    try {
      // 执行用户传入的 fn
      return this.fn()
    } finally {
      // 将刚存的值赋值回去
      shouldTrack = prevShouldTrack
      activeEffect = this.#parent
      this.#parent = undefined
    }
  }

  stop() {
    if (this.#active) {
      // 如果第一次执行 stop 后 active 就 false 了
      // 这是为了防止重复的调用，执行 stop 逻辑
      cleanupEffect(this)
      this.onStop && this.onStop()
    }

    this.#active = false
  }
}

function cleanupEffect(effect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里面把 effect 给删除掉
  effect.deps.forEach(dep => {
    dep.delete(effect)
  })

  effect.deps = []
}



/* 追踪收集依赖 */
function track(target, key) {}

/* 触发依赖 */
function trigger(target, key) {}


export {
  effect,
  ReactiveEffect,
  track,
  trigger
}