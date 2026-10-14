export function checkConnected(net) {
  const { width, height, str, origin, size } = net

  const checkedIndexes = new Set()
  let count = 0

  checkIndex(origin)

  return count === size

  function checkIndex(index) {
    if (checkedIndexes.has(index)) {
      return
    }

    checkedIndexes.add(index)

    count++

    let x = index % width
    let y = (index - x) / width

    // Left
    if (x > 0) {
      if (str[index - 1] === '#') {
        checkIndex(index - 1)
      }
    }

    // Right
    if (x < width - 1) {
      if (str[index + 1] === '#') {
        checkIndex(index + 1)
      }
    }

    // Up
    if (y > 0) {
      if (str[index - width] === '#') {
        checkIndex(index - width)
      }
    }

    // Down
    if (y < height - 1) {
      if (str[index + width] === '#') {
        checkIndex(index + width)
      }
    }
  }
}

export function assessNet(net, ocs) {
  const { width, height, str, origin } = net

  const indexToOcs = []
  const matchedSquares = new Map()

  const failures = checkIndex(origin, ocs)

  if (failures) {
    return false
  } else {
    return indexToOcs
  }

  function checkIndex(index, ocs) {
    if (indexToOcs[index]) {
      // We've already checked this index, so long as the OCS is the same we're fine
      if (indexToOcs[index] !== ocs) {
        return [index]
      } else {
        return false
      }
    }

    if (matchedSquares.has(ocs.square)) {
      // We've already matched this square somewhere else
      return [index, matchedSquares.get(ocs.square)]
    }

    indexToOcs[index] = ocs
    matchedSquares.set(ocs.square, index)

    let x = index % width
    let y = (index - x) / width

    // Left
    if (x > 0) {
      if (str[index - 1] === '#') {
        const failures = checkIndex(index - 1, ocs.left)

        if (failures) {
          return failures
        }
      }
    }

    // Right
    if (x < width - 1) {
      if (str[index + 1] === '#') {
        const failures = checkIndex(index + 1, ocs.right)

        if (failures) {
          return failures
        }
      }
    }

    // Up
    if (y > 0) {
      if (str[index - width] === '#') {
        const failures = checkIndex(index - width, ocs.up)

        if (failures) {
          return failures
        }
      }
    }

    // Down
    if (y < height - 1) {
      if (str[index + width] === '#') {
        const failures = checkIndex(index + width, ocs.down)

        if (failures) {
          return failures
        }
      }
    }

    return false
  }
}