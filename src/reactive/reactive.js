/* 简单实现理解原理不考虑 readonly 和 shallow 了 */

import { isObject } from '../utils/index.js'
import { baseHandlers } from './baseHandlers.js'

/* 原始对象和响应式对象(代理)之间的映射, WeakMap 的好处就是 key 被垃圾回收之后 那么对应的 key value 都会被从 WeakMap 自动删除  */
/** 
 * @type {WeakMap<object, proxy>}
 */
const reactiveMap = new WeakMap()

const reactiveFlags = {
  IS_REACTIVE: '__v_isReactive', // 判断是否已被reactive的标识
  RAW: '__v_raw'  // 挂载原始对象的字段
}

/**
 * @description: 判断一个值是否是一个响应式对象
 * @param {*} value
 * @return { boolean }
 */
function isReactive(value) {
  return !!value[reactiveFlags.IS_REACTIVE]
}

/**
 * @description: 返回一个响应式对象
 * @param { object } target
 * @return { Proxy }
 */
function reactive(target) {
  return createReactiveObject(target, reactiveMap, baseHandlers)
}


/**
 * @description: 创建一个响应式对象
 * @param { object } target
 * @param { WeakMap<object, proxy> } proxyMap
 * @param { { get:function, set: function } } baseHandlers
 * @return { Proxy }
 */
function createReactiveObject(target, proxyMap, baseHandlers) {
  /* 非对象类型，直接返回 target  */
  if (!isObject(target)) return target
  /* 如果已经是一个响应式对象了 也不需要响应化的操作了 直接返回它 */
  if (isReactive(target)) return target
  /* 如果 原始对象和响应式对象的map 里面已经存在了，说明这个原始对象已经被响应式操作过一次了，直接返回缓存map 里面的响应式对象即可 */
  if (proxyMap.has(target)) return proxyMap.get(target)

  const p = new Proxy(target, baseHandlers)
  reactiveMap.set(target, p)
  return p
}


export {
  reactiveMap,
  reactiveFlags,
  isReactive,
  reactive,
  createReactiveObject
}