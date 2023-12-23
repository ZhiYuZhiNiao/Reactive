import { ReactiveEffect } from "./effect.js"

/**
 * @description 面向用户的
 * @param {(onCleanup: (cancel: () => {}) => {}) => {}} effect 
 */
export function watchEffect(effect) {
  return doWatch(effect)
}

/**
 * @description watch 和 watchEffect 都是通过这个方法实现的
 * @param { (onCleanup: (cancel: () => {}) => {}) => {} } source 
 * @param { function } cb 
 * @param {*} opts 
 * @returns { () => {} }
 */
export function doWatch(source, cb, opts) {
  let getter = () => {
    if (cleanup) cleanup()
    // 执行用户传递的 effect 就是 watchEffect 的参数
    source(onCleanup)
  }

  /**
   * @type { () => {} }
   */
  let cleanup

  /**
   * @description onCleanup 这个函数是我们提供给用户的, 由用户去执行, fn是用户通过onCleanup的参数传递给我们的, 执行由我们内部去执行
   * 核心就是我们控制 fn 的执行时机, 第一次执行的时候不执行，后面会在每次触发的时候最开始的时候执行
   * vue3官方demo就是传入一个 cancel 函数，就用在下一次触发一个请求发送之前，去执行这个cancel 从而取消上一次的请求
   * @param { function } fn
   */
  const onCleanup = (fn) => {
    cleanup = effect.onStop = () => {
      fn()
    }
  }

  // 更新的时候就不会执行 getter了. 而是去执行 job 方法.
  // 这里不用这个job也没问题，可能是因为 watch 方法需要使用这个
  const job = () => {
    if (!effect.active) return
    effect.run()
  }

  const effect = new ReactiveEffect(getter, job)
  // 第一次执行
  effect.run()

  // 注销, 停止监测, 就是把那些收集的依赖从 deps 中删除
  const unwatch = () => {
    effect.stop()
  }

  return unwatch
}