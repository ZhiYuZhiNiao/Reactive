import { toReactive } from './reactive.js'
import { canTrack, trackEffects, triggerEffects } from './effect.js'
import { isFunction } from '../utils/index.js'

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
  反正一句话, deps 依赖集合 是活的那部分, 其他都重用了 effect.js 里面的东西
  说到底就是 收集依赖和触发依赖的位置变了, 触发和收集的时候 换了一个 deps

  还有就是 RefImpl 内部使用了2个值,
  1 _rawValue 原始值
  2 _value toReactive 之后返回的值 (可能是一个基本数据类型， or proxy响应式的代理对象)

  我们打点访问 .value 的时候返回的就是 _value
  我们 .value 进行 set 的时候, 会把_rawValue更改, _value 更改

  RefImpl 中我们单独进行了依赖收集和触发,, 而不是在 reactvie 的代理proxy 里面的 get set 进行的
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

/**
 * @param { function | object } val
 */
export function toValue(val) {
  let res = val
  if (isFunction(val)) {
    res = val()
  }
  return isRef(res) ? res.value : res
}


/**
 * @description 将一个响应式对象转换为一个普通对象，这个普通对象的每个属性对应的值都会被包装成一个 ObjectRefImpl 对象 
 * ObjectRefImpl 对象中存有源对象的 引用 和 key,, 当我们进行 get set 的时候 都是通过这个引用和 key 来进行的
 * 因为源对象是响应式的，所以通过引用和 key 去操作源对象，一样会触发响应式
 * @param {*} object 
 */
export function toRefs(object) {
  const res = Array.isArray(object) ? new Array(object.length) : {}
  for (const key in object) {
    res[key] = toRef(object, key)
  }
  return res
}

/**
 * @description 函数用于将一个普通的响应式对象或响应式数组转换为响应式引用， 不会把一个普通的对象的属性转成响应式
 * 如果传入单个参数，则会基于 ref 去包装
 * @param { object } object
 * @param { string } key
 * @param {*} defaultValue
 */
export function toRef(object, key, defaultValue) {
  let res = object
  // 只传入一个参数
  if (key === undefined) {
    if (isFunction(object)) {
      res = object()
    }
    return isRef(res) ? res : ref(res)
  }
  // 本身是ref的不转换，否则转换成 ObjectRefImpl
  return isRef(object[key]) ? object[key] : new ObjectRefImpl(object, key, defaultValue)
}

// toRef 返回的就是这个对象, 需要注意的是这个对象并不需要进行依赖的收集和触发
class ObjectRefImpl {

  __v_isRef = true // 标识是否是 ref 对象
  deps
  constructor(object, key, defaultValue) {
    this._object = object
    this._key = key
    this._defaultValue = defaultValue
  }

  get value() {
    const { _key, _object, defaultValue } = this
    return _key in _object ? _object[_key] : defaultValue
  }

  set value(newVal) {
    const { _key, _object } = this
    _object[_key] = newVal
  }
}