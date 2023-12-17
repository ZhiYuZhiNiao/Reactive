import { createDep } from './dep'

/**
 * @description: 对我外暴露给用户的, 可以把用户传入的回调函数作为 effect 绑定在回调函数中收集的依赖上, 当依赖被触发就会执行这个 effect
 * @param { function } fn
 * @param { { lazy: boolean } } options
 * @return {}
 */
export function effect(fn, opts = { lazy: false }) {
  const effect = createReactiveEffect(fn, opts)
  return effect
}

/**
 * @description: 创建响应式的effect
 * @param { function } fn
 * @param { { lazy: boolean } } opts
 * @return {*}
 */
function createReactiveEffect(fn, opts = { lazy: false }) {}

/* 追踪收集依赖 */
export function track(target, key) {}

/* 触发依赖 */
export function trigger(target, key) {}
