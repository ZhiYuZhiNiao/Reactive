import { RefImpl } from "./ref.js"
/**
 * @description: effect函数的回调函数会被包裹成一个 effect对象，然后执行这个回调函数的时候会对这个 effect实例进行依赖的收集
 * @param { function } fn 
 * @param { object } opts 配置项 
 * @param { boolean } opts.lazy 是否立即执行一次fn
 * @param { function } opts.scheduler 如果传入了该参数,依赖触发的时候不会再执行fn 而是执行这个函数
 * @param { function } opts.onStop stop 方法执行的时候会触发这个回调函数
 * @return {{ effect: ReactiveEffect }} runner 是一个函数，这个函数上挂载了一个effect对象
 * 
 * @example
 * effect(() => {}, { lazy: false, scheduler: undefined, onStop: undefined })
 */
export function effect(fn, opts) {
  const _effect = new ReactiveEffect(fn)
  // 扩展 _effect对象属性
  Object.assign(_effect, opts)
  if (!opts?.lazy) {
    // 立即执行一次 effect包裹的fn
    _effect.run()
  }
  // 把effect的run方法返回出去供用户进行手动的使用，并且把 effect对象绑定上去(effect对象上有很多信息)
  // 用户调用 stop的时候需要传入 runner, stop方法内部需要使用 effect对象
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}


/**
 * @description: 执行stop方法之后后续再触发的依赖的时候就不会再去执行 effect里面包裹的方法，直接我们再次调用 runner
 * @param {function} runner
 * @return {void}
 */
export function stop(runner) {
  runner.effect.stop()
}

/***
 * @type { ReactiveEffect }
 */
export let activeEffect // 当前的 activeEffect 实例
export class ReactiveEffect {

  active = true // 当前 effect 是否是激活状态, 非激活状态只会执行fn, 但是不进行依赖收集
  /**
   * @description 当前的 effect实例被哪些 依赖集合收集过, vue源码使用的是一个数组, 用集合不是更好么？(因为push的时候肯定不可能有重复的?)
   * 使用 deps 在 track 的时候进行双向的收集, dep 收集 effect, effect也收集 dep
   * @type {Array<Set<ReactiveEffect>>}
   */
  deps = []
  /**
   * @type {function}
   */
  onStop
  /***
   * @type {function}
   */
  scheduler
  /***
   * @type { ReactiveEffect }
   */
  prevEffect

  /**
   * @description: 
   * @param { function } fn
   * @return { ReactiveEffect }
   */  
  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler
  }

  /* 
    eg: 外部这样进行调用, 所以我们需要一个全局的 activeEffect 变量，这个变量就表示当前正确的 effect实例
    当如下这种嵌套结构的时候 (我们可以使用一个栈结构来进行存储), vue3的源码没有使用栈结构
    多使用了一个 prevEffect 变量,, 我们这样存储就是为了保证 收集的 effect 和 收集的地方是对应起来的
    eg: p.sex, 和 p.age那里收集的 effect 就是第一个 effect里面的函数(这个函数被effect实例包裹) 这2个属性收集的effect实例是同一个
    我们在 p.name那里收集的 effect 就是内层 effect里面嵌套的函数(这个函数被effect实例包裹), 这是一个新的 effect实例
    effect(() => {
      console.log(p.age)
      effect(() => {
        console.log(p.name)
      })
      // 这里就回到了上一层的 effect, 这里p.sex 进行依赖收集的话, 收集的 effect 就是当前层的 effect
      console.log(p.sex)
    })
  */

  run() {
    // 只能手动调用 runner, 进而调用fn, 不会再进行依赖的收集 (因为依赖收集的时候使用了 activeEffect 来进行判断)
    if (!this.active) {
      return this.fn()
    }
    this.prevEffect = activeEffect // 存下上一层的 effect
    activeEffect = this // 存下当前的 effect
    // 骚操作来了, try里面的 return 并不会中止 finally 块中的代码执行
    try {
      // 触发依赖收集, 收集的就是当前的 activeEffect
      return this.fn()
    } finally {
      // 执行到这里表示当前的这一层已经执行结束了，现在需要回到上一层
      activeEffect = this.prevEffect
      // 置空当前 this 里面的 prevEffect 让垃圾回收器进行回收 (因为这一层已经结束，不会再用到这一层的 prevEffect 了)
      this.prevEffect = undefined
    }
  }


  stop() {
    if (!this.active) return
    // 找到收集了这个 effect 实例的所有 deps集合，然后从这些集合中分一 一 删除掉这个 effect 实例
    cleanupEffect(this)
    if (this.onStop) {
      this.onStop()
    }
    this.active = false
  }
}


/**
 * @description: stop方法执行的时候，需要从收集过这个effect 实例的各个集合中删除掉这个 effect，这样就能阻止依赖被触发的时候会再次执行到这个 effect
 * @param { ReactiveEffect } effect
 * @return { void }
 */
function cleanupEffect(effect) {
  effect.deps.forEach(dep => dep.delete(effect))
  // 置空
  effect.deps.length = 0
}

/**
 * @description 用于存储 effect 的容器，结构如下
 * @type { WeakMap<Object, Map<String | Symbol, Set<ReactiveEffect>>> }
 */
const targetMap = new WeakMap()
/* 追踪收集依赖 */
export function track(target, key) {
  if (!canTrack()) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 依赖集合
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  trackEffects(deps)
}


/**
 * @description 收集effect
 * @param { Set<ReactiveEffect | RefImpl> } deps
 */
export function trackEffects(deps) {
  // 如果已经存在了, 就不用再收集了
  if (deps.has(activeEffect)) return
  // 双向收集
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

/**
 * @description: 是否可以进行收集, 里面只是判断了当前的 activeEffect 是否存在
 * @return { boolean }
 */
export function canTrack() {
  // 我们收集的就是当前的 effect实例，如果当前的effect实例不存在，那么肯定就不需要收集了
  return !!activeEffect
}

/* 触发依赖 */
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const deps = depsMap?.get(key)
  if (!deps) return
  triggerEffects(deps)
}

/**
 * @description 触发 deps 里面的 effect
 * @param { Set<ReactiveEffect | RefImpl> } deps
 */
export function triggerEffects(deps) {
  // 执行, 如果用户传入了scheduler参数，则依赖触发的时候执行 scheduler 不去执行 fn
  deps.forEach(effect => {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.fn()
    }
  })
}
