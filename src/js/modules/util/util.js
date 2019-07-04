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
  },

  groupBy () {
    Array.prototype.groupBy = function (key) {
      const arraySelf = this
      return arraySelf.reduce(function (accumulator, currentValue) {
        if (currentValue.hasOwnProperty(key)) {
          (accumulator[currentValue[key]] = accumulator[currentValue[key]] || []).push(currentValue)
        }
        return accumulator
      }, {})
    }
  }
}

export default util