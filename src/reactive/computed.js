
import { isFunction } from "../utils/index.js"
import { ReactiveEffect } from './effect.js'
import { trackRefValue, triggerRefValue } from './ref.js'
/**
 * 
 * @param {function | object} opts
 */
export function computed(opts) {
  /**
   * @type {function}
   */
  let getter

  /**
   * @type {function}
   */
  let setter

  if (isFunction(opts)) {
    getter = opts
    setter = (() => {})
  } else {
    getter = opts.get
    setter = opts.set ?? (() => {})
  }

  return new ComputedRefImpl(getter, setter)
}

/**
 * @example
 * const foo = reactive({
    a: 1
  })
const bar = computed(() => foo.a + 1)

effect(() => {
   console.log('更新：' + bar.value)
})
foo.a = 2

1 执行 effect() 方法，执行 effect.run()方法，此时 activeEffect = 当前 effect 实例
2 bar.value 的时候触发 get把 执行 trackRefValue(this) -- trackEffects(ref.deps || (ref.deps = new Set())), 
  执行这个方法也就会把当前的activeEffect add 到 computedRef 对象的 deps 里面, 就是把第一步的 effect 实例 add到这个 deps 里面
3 因为开始默认 _dirty = true 所以会执行 get里面的 this.effect.run()  调用这个方法的时候，又把当前的 activeEffect = computed.effect, 并且把 _dirty = false
4 调用 this.effect.run() (实际上就是调用 getter， 就是computed 的第一个参数) 方法的时候 foo.a 又触发了 get 收集，把 computed.effect 收集到了  foo 下 a 属性下的 deps 里面
5 foo.a = 2 也就触发了 他之前收集的依赖， 也就会执行 computed.effect， 由于我们 new ReactiveEffect 的时候传入了第二个参数 scheduler, 所以触发执行的时候会执行这个我们传入第二个参数
  由于 _dirty = false 所以就执行到了 triggerRefValue(this) 这个方法内部会执行triggerEffects(computedRef.deps), 并且 _dirty = true
6 所以最后就会执行 当前 computedRef 里面的 deps 里面 收集的 effect, 也就是第二步 我们收集的那个 effect 也就是 effect(() => { console.log('更新：' + bar.value) })里面的回调函数
7 再次执行到了 bar.value , 再次触发 get, 由于 _dirty = true 所以再次执行 this.effect.run()  this._value = 我们传入的 getter()的返回值 最后把 this.value 返回了出去  这就是一次完整的computed计算

简单来说，就是 foo.a = 2 改变，触发 effect 里面的回调函数, 再次执行这个回调函数，bar.value 的get访问 执行上会执行 computed 里面的 getter 的再次执行，且 bar.value = getter()
 */
class ComputedRefImpl {
  __v_isRef = true

  /**
   * @type { ReactiveEffect }
   */
  effect

  /**
   * @description 存储使用了computed值的effect
   * @type { Set<ReactiveEffect> }
   */
  deps

  _value

  _dirty = true // 标识getter计算出来的值是否是脏的，是否需要重新计算，一开始肯定要计算的
  
  /**
   * 
   * @param {function} getter 
   * @param {function} setter 
   */
  constructor(getter, setter) {
    this._getter = getter
    this._setter = setter

    // 第二个参数scheduler 表示依赖触发的时候会调用这个回调函数，而不是调用第一个参数(回调函数)
    // 个人觉得这里直接使用 effect 方法 是否更加统一? 
    // 副作用，让数据变脏...
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        // 触发依赖
        triggerRefValue(this)
      }
    })
  }

  // 比如我们使用 const count = computed(() => count.value), 我们在页面中使用 count 就会调用 count.value
  get value() {
    // 收集所有使用了本computed值的依赖effect， 具体实现见 ref.js
    trackRefValue(this)
    // 只有在数据脏了，也就是其关联的响应式对象发生变化后才重新计算，这样就能保证在多次使用computed值时，不用多次计算，节省性能
    if (this._dirty) {
      this._dirty = false
      // 这里的 run 就是 getter 方法
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newValue) {
    this._setter(newValue)
  }
}