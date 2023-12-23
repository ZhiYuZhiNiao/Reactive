import { reactive, effect, stop, ref, toRef, toRefs, watchEffect } from "./src/reactive/index.js"

const count = ref(0)

watchEffect((onCleanup) => {
  onCleanup(cancel)
  console.log(`${count.value}count变化开始发送请求`)
})


function cancel() {
  console.log('取消上一次的请求')
}

// setInterval(() => {
//   count.value++
// }, 4000)


