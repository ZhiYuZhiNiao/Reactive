import { toReactive } from './reactive.js'
import { canTrack, trackEffects, triggerEffects } from './effect.js'


/**
 * @param {*} val
 * @return { RefImpl }
 */
export function ref(val) {
  if (isRef(val)) return val
  return new RefImpl(val)
}

/**
 * @param { RefImpl } val 
 * @return { boolean }
 */
export function isRef(val) {
  return !!(val?.__v_isRef)
}

// ps: Impl 就是 类实现 的意思
/* 
  理一下思路eg: effect(() => {console.log(p.age)})  p 是一个 reactive对象
  当我们调用 effect 的时候会立即创建一个 effect实例(这个对象包裹了effect函数的回调函数fn)
  然后回立即调用 effect里面包裹的 fn 会触发get 进行依赖收集, 然后会改变当前的 activeEffect 为当前的 effect实例
  依赖收集在 targetMap<object, depsMap<string, Set<effect实例>>>

  我们在ref.js 文件中调用了 trackEffects, 会把这个文件中对应的 deps(依赖集合) 传入进去。。

  反正一句话, deps 依赖集合 是活的那部分, 其他都重用了 effect.js 里面的东西
  说到底就是 收集和触发的位置变了, 触发和收集的时候 换了一个 deps
*/
export class RefImpl {
  __v_isRef = true
  
  /**
   * @description effect.js中的 deps 是存在一个 Map 里面的, 这里的deps存在了 ref实例上面, deps是灵活的部分
   * @type {Set<RefImpl>}
   */
  deps

  constructor(val) {
    // toReactive 如果是复杂数据类型内部会调用 reactive, 如果不是则直接返回
    this._value = toReactive(val)
    this._rawValue = val // 存下原始值
  }

  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    // 新旧值发生变化，触发依赖更新
    if (Object.is(this._rawValue, newVal)) return
    this._rawValue = newVal // 修改原始值
    this._value = toReactive(this._rawValue) // 响应式化新值
    // 触发依赖更新
    triggerRefValue(this)
  }
}

/**
 * @param { RefImpl } ref
 */
export function trackRefValue(ref) {
  if (!canTrack()) return
  trackEffects(ref.deps || (ref.deps = new Set()))
}

/**
 * 
 * @param { RefImpl } ref 
 */
export function triggerRefValue(ref) {
  if (!ref.deps) return
  triggerEffects(ref.deps)
}