const util = {
  registerArrayLast: () => {
    if (!Array.prototype.last) {
      Array.prototype.last = function () {
        const arraySelf = this
        return arraySelf[arraySelf.length - 1]
      }
    }
  },

  registerArrayFirst: () => {
    if (!Array.prototype.first) {
      Array.prototype.first = function () {
        const arraySelf = this
        return arraySelf[0]
      }
    }
  }
}

export default util