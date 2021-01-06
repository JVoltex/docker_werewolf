'use strict'
module.exports.sleep = (sec=1) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("time"), sec * 1000);
  })
}

