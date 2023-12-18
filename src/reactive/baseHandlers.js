/*
 * @Description: 主要就是创建 new proxy 的第二个参数
 * get, 和 set
 */

import { isObject } from '../utils/index.js'
import { reactive, reactiveFlags, reactiveMap } from './reactive.js'
import { track, trigger } from "./effect.js"

function createGetter() {
  return function(target, key, receiver) {
    /* 
      如果 key 是 __v_raw 即想要获取原始对象 , 并且代理对象和原始对象对应上了, 返回target (原始对象)
      receiver 指上下文, 可以理解成是谁 打点访问 __v_raw 这个属性, 下面判断代码意思就是说
      如果一个响应式对象(代理对象) 打点访问 __v_raw 属性，我们就给它返回原始对象
    */
    if (key === reactiveFlags.RAW && receiver === reactiveMap.get(target)) return target
    // 进入到这个 getter 函数，说明这个对象肯定是一个被代理过的对象
    if (key === reactiveFlags.IS_REACTIVE) return true

    /* 从原始对象(被代理对象)中获取对应的属性值 */
    const res = Reflect.get(target, key, receiver)

    /* 收集 依赖 */
    track(target, key)

    // 值如果是对象，则继续代理值，相比vue2的一开始就递归响应式化所有值，这里只在get用到的时候才代理，算是性能上的优化
    if (isObject(res)) {
      return reactive(res)
    }

    return res
  }
}

function createSetter() {
  return function(target, key, newVal, receiver) {
    const oldVal = target[key]
    // 给原始对象设置值, res 是一个布尔值
    const res = Reflect.set(target, key, newVal, receiver)
    /* 新旧值发生变化, 则触发依赖更新 */
    if (!Object.is(oldVal, newVal)) {
      trigger(target, key)
    }

    return res
  }
}


const get = createGetter()
const set = createSetter()


const baseHandlers = {
  get,
  set
}

export {
  baseHandlers
}






