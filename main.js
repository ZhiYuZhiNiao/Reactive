import { reactive, effect, stop } from "./src/reactive/index.js"
import { ref } from './src/reactive/ref.js'

const p = reactive({
  age: 18,
  name: '张三'
})

const count = ref(0)
console.log('count = ', count)

const runner = effect(() => {
  console.log(count.value)
})


let i = 1
setInterval(() => {
  count.value++
  i++
  if (i >= 4) {
    stop(runner)
  }
}, 2000)

// runner() // 手动执行, 如果我们传了 lazy

// stop(runner)
