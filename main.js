import { reactive, effect, stop } from "./src/reactive/index.js"

const p = reactive({
  age: 18,
  name: '张三'
})


const runner = effect(() => {
  console.log('fn-----', p.age)
}, {
  scheduler() {
    console.log('scheduler', p.age)
  },
  lazy: false,
  onStop() {
    console.log('onStop')
  }
})


let i = 1
setInterval(() => {
  p.age++
  i++
  if (i >= 4) {
    stop(runner)
  }
}, 2000)

// runner() // 手动执行, 如果我们传了 lazy

// stop(runner)
