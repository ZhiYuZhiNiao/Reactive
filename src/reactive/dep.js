/**
 * @description: 不传参数返回的是一个空集合
 * @param { undefined | [function]} effects
 * @return { Set<function> }
 */
function createDep(effects) {
  /* Set 参数如果是 undefined 则创建的是一个空集合 */
  return new Set(effects)
}

export {
  createDep
}