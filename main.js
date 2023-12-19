import { reactive, effect, stop, ref, toRef, toRefs } from "./src/reactive/index.js"

const p = reactive({
  age: 18,
  name: '张三',
  o: {
    count: 1
  }
})


var obj = {
  name: '李四',
  age: 1
}

obj = reactive(obj)

// const age = toRef(obj, 'age')
const { age, name } = toRefs(obj)
console.log('age', age)
console.log('name', name)
effect(() => {
  console.log(age.value)
})

// setInterval(() => {
//   age.value++
// }, 1500)


