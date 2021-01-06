async function _sleep(sec) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve("time"), sec * 1000)
  })
}

async function test(sec) {
  await _sleep(sec)
  console.log("time!")
}
test(3000)
