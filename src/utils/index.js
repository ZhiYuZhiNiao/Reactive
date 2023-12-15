
/**
 * @description: 判断一个值是否是一个对象(function在这里不算一个对象)
 * @param {*} val
 * @return { boolean }
 */
function isObject(val) {
  return (val !== null) && (typeof val) === 'object'
}


export {
  isObject
}

