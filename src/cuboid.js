const AXES = ['x', 'y', 'z']

let id = 0

class Square {
  constructor(x, y, z, side) {
    this.id = `${++id}`
    this.x = x
    this.y = y
    this.z = z

    // The 'side' is named after the axis that doesn't change when moving around that side
    this.side = side

    // Each square has 4 neighbours, so two of these will be null. The directions are relative to the start square and
    // describe the direction of travel, e.g. upX means move in the direction that increases the x value. If it reaches
    // a corner then other values may also change.
    this.upX = this.downX = this.upY = this.downY = this.upZ = this.downZ = null
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`
  }
}

export class CuboidGeometry {
  // x must be the biggest, z the smallest
  constructor(x, y, z) {
    if (x < y || y < z) {
      throw new Error('CuboidGeometry sizes need to be descending')
    }

    this.area = 2 * (x * y + x * z + y * z)
    this.x = x
    this.y = y
    this.z = z

    this.squares = []

    // Biggest side
    for (const c of [0, z + 1]) {
      for (let b = 1; b <= y; ++b) {
        for (let a = 1; a <= x; ++a) {
          this.squares.push(new Square(a, b, c, 'z'))
        }
      }
    }

    // Middle side
    for (const b of [0, y + 1]) {
      for (let c = 1; c <= z; ++c) {
        for (let a = 1; a <= x; ++a) {
          this.squares.push(new Square(a, b, c, 'y'))
        }
      }
    }

    // Smallest side
    for (const a of [0, x + 1]) {
      for (let c = 1; c <= z; ++c) {
        for (let b = 1; b <= y; ++b) {
          this.squares.push(new Square(a, b, c, 'x'))
        }
      }
    }

    // Wiring up the neighbours
    for (const square of this.squares) {
      const { x, y, z, side } = square

      for (const axis of AXES) {
        // Wrong side for this axis
        if (axis === side) {
          continue
        }

        const squareValue = square[axis]

        for (const direction of [-1, 1]) {
          const newValue = squareValue + direction
          const newSquare = {
            x,
            y,
            z,
            [axis]: newValue
          }

          if (newValue === 0 || newValue === this[axis] + 1) {
            if (square[side] === 0) {
              newSquare[side]++
            } else if (square[side] === this[side] + 1) {
              newSquare[side]--
            } else {
              throw new Error('Unexpected error wiring up links between squares')
            }
          }

          const adjacentSquare = this.findSquare(newSquare.x, newSquare.y, newSquare.z)

          if (!adjacentSquare) {
            throw new Error('Square not found')
          }

          const property = (direction === 1 ? 'up' : 'down') + axis.toUpperCase()

          if (square[property]) {
            throw new Error(property + ' already set')
          }

          square[property] = adjacentSquare
        }
      }
    }
  }

  findSquare(x, y, z) {
    return this.squares.find(sq => sq.x === x && sq.y === y && sq.z === z)
  }
}

export class OrientedCuboidSquare {
  static forCuboid(cuboid) {
    const ocses = []

    function find(square, direction) {
      return ocses.find(ocs => ocs.square === square && ocs.direction === direction)
    }

    function populateLeftRight(ocs, leftDirection) {
      let fromOcsRotated = find(ocs.square, leftDirection)
      let fromOcs = ocs

      while (!fromOcs.left) {
        const toOcsRotated = fromOcsRotated.up

        const toOcs = find(toOcsRotated.square, ocs.direction)

        fromOcs.left = toOcs
        toOcs.right = fromOcs

        fromOcsRotated = toOcsRotated
        fromOcs = toOcs
      }
    }

    for (const square of cuboid.squares) {
      for (const axis of AXES) {
        if (axis === square.side) {
          continue
        }

        for (const direction of ['up', 'down']) {
          ocses.push(new OrientedCuboidSquare(cuboid, square, direction + axis.toUpperCase()))
        }
      }
    }

    // Wire up the links to adjacent OCSes
    for (const ocs of ocses) {
      // 'up' is just the direction of the OCS
      const ocsSquare = ocs.square
      const ocsSide = ocsSquare.side
      const newSquare = ocsSquare[ocs.direction]
      let newDirection = ocs.direction

      // Have we wrapped around a corner?
      if (ocsSide !== newSquare.side) {
        newDirection = (ocsSquare[ocsSide] < newSquare[ocsSide] ? 'up' : 'down') + ocsSide.toUpperCase()
      }

      const newOcs = find(newSquare, newDirection)
      ocs.up = newOcs
      newOcs.down = ocs
    }

    // Map from the 'up' direction to the corresponding 'left' direction for the front 'z' face
    const frontFaceMappings = {
      upX: 'downY',
      downX: 'upY',
      upY: 'upX',
      downY: 'downX'
    }

    for (const ocs of ocses) {
      // Front z face, populate left/right for upX, downX, upY and downY
      if (ocs.square.z === 0) {
        const leftDirection = frontFaceMappings[ocs.direction]

        // Walk around the surface adding left/right entries
        populateLeftRight(ocs, leftDirection)
      }

      // Still need to handle upZ and downZ, use the left 'x' face for that
      if (ocs.square.x === 0) {
        const leftDirection = ocs.direction === 'upZ' ? 'upY' : 'downY'

        populateLeftRight(ocs, leftDirection)
      }
    }

    return ocses
  }

  static forCuboidDedupe(cuboid) {
    let ocses = this.forCuboid(cuboid)

    ocses = ocses.filter(({ square }) => square.x === 0 || square.y === 0 || square.z === 0)

    const maxX = Math.ceil(cuboid.x / 2)

    ocses = ocses.filter(({ square }) => square.x <= maxX)

    // This only applies to the x side and in practice we only hit it above 4x3x2
    const maxY = Math.ceil(cuboid.y / 2)

    ocses = ocses.filter(({ square }) => square.side !== 'x' || square.y <= maxY)

    // Along the middle band we can remove those below the middle line
    if (cuboid.x % 2 === 1) {
      const middleX = (cuboid.x + 1) / 2
      const middleY = Math.ceil(cuboid.y / 2)
      const middleZ = Math.ceil(cuboid.z / 2)

      ocses = ocses.filter(({ square }) => square.x !== middleX || (square.side === 'z' && square.y <= middleY) || (square.side === 'y' && square.z <= middleZ))

      // If both sides have odd lengths the central square can be reduced further (if the sides are equal that'll be further reduced later)
      if (cuboid.y % 2 === 1) {
        ocses = ocses.filter(({ square, direction }) => square.side !== 'z' || square.x !== middleX || square.y !== middleY || direction.startsWith('up'))
      }

      if (cuboid.z % 2 === 1) {
        ocses = ocses.filter(({ square, direction }) => square.side !== 'y' || square.x !== middleX || square.z !== middleZ || direction.startsWith('up'))
      }
    }

    if (cuboid.z % 2 === 1) {
      const middleX = Math.ceil(cuboid.x / 2)
      const middleY = Math.ceil(cuboid.y / 2)
      const middleZ = (cuboid.z + 1) / 2

      ocses = ocses.filter(({ square }) => square.z !== middleZ || (square.side === 'x' && square.y <= middleY) || (square.side === 'y' && square.x <= middleX))

      // If both sides have odd lengths the central square can be reduced further (if the sides are equal that'll be further reduced later)
      if (cuboid.y % 2 === 1) {
        ocses = ocses.filter(({ square, direction }) => square.side !== 'x' || square.y !== middleY || square.z !== middleZ || direction.startsWith('up'))
      }
    }

    if (cuboid.y % 2 === 1) {
      const middleX = Math.ceil(cuboid.x / 2)
      const middleY = (cuboid.y + 1) / 2
      const middleZ = Math.ceil(cuboid.z / 2)

      ocses = ocses.filter(({ square }) => square.y !== middleY || (square.side === 'x' && square.z <= middleZ) || (square.side === 'z' && square.x <= middleX))
    }

    if (cuboid.x === cuboid.y) {
      ocses = ocses.filter(({ square }) => square.x !== 0)

      const middleX = (cuboid.x + 1) / 2
      const middleY = (cuboid.y + 1) / 2
      ocses = ocses.filter(({ square, direction }) => square.side !== 'z' || (square.x === middleX && square.y === middleY && direction === 'upX') || (square.x <= middleX && square.y < middleY))
    }

    if (cuboid.y === cuboid.z) {
      ocses = ocses.filter(({ square }) => square.y !== 0)

      const middleY = (cuboid.y + 1) / 2
      const middleZ = (cuboid.z + 1) / 2
      ocses = ocses.filter(({ square, direction }) => square.side !== 'x' || (square.y === middleY && square.z === middleZ && direction === 'upY') || (square.y <= middleY && square.z < middleZ))
    }

    return ocses
  }

  constructor(cuboid, square, direction) {
    this.cuboid = cuboid
    this.square = square
    this.direction = direction

    if (!/^(up|down)[XYZ]$/.test(direction)) {
      throw new Error('Unknown direction')
    }

    if (direction.endsWith(this.square.side.toUpperCase())) {
      throw new Error('direction cannot be on the same side as the square')
    }

    // These directions refer to moving around a net. The 'direction' property of OCS corresponds to the 'up' direction
    // of the net being walked, with the other directions being relative to the net's 'up'.
    this.up = this.down = this.left = this.right = null
  }

  toString() {
    return `[${this.cuboid.x} x ${this.cuboid.y} x ${this.cuboid.z}], ${this.square}, ${this.direction}`
  }
}
