export class Polyomino {
  constructor(str, width, height) {
    this.width = width
    this.height = height
    this.str = str

    if (str.length !== width * height) {
      throw new Error('size mismatch')
    }

    let size = 0

    for (let i = 0; i < str.length; ++i) {
      if (str[i] === '#') {
        ++size
      }
    }

    this.size = size
    this.origin = str.indexOf('#')
    this.normal = null
    this.parent = null
  }

  equals(other) {
    return this.width === other.width && this.height === other.height && this.str === other.str
  }

  rotate90() {
    let s = ''

    for (let rowStart = this.width * (this.height - 1); rowStart < this.width * this.height; ++rowStart) {
      for (let index = rowStart; index >= 0; index -= this.width) {
        s += this.str[index]
      }
    }

    return new Polyomino(s, this.height, this.width)
  }

  flip() {
    let s = ''

    for (let rowStart = this.width * (this.height - 1); rowStart >= 0; rowStart -= this.width) {
      s += this.str.slice(rowStart, rowStart + this.width)
    }

    return new Polyomino(s, this.width, this.height)
  }

  symmetries() {
    const group = [this]

    const rotated90 = this.rotate90()

    if (!this.equals(rotated90)) {
      group.push(rotated90)

      const rotated180 = rotated90.rotate90()

      if (!this.equals(rotated180)) {
        group.push(rotated180)

        group.push(rotated180.rotate90())
      }
    }

    const flipped = this.flip()

    if (group.every(poly => !poly.equals(flipped))) {
      const length = group.length
      group.push(flipped)

      for (let index = 1; index < length; ++index) {
        group.push(group[index].flip())
      }
    }

    return group
  }

  normalize() {
    if (this.normal) {
      return this.normal
    }

    let group = this.symmetries()
    const width = group[0].width
    const height = group[0].height
    const normWidth = Math.max(width, height)
    const normHeight = Math.min(width, height)

    if (normWidth !== normHeight) {
      group = group.filter(poly => poly.width === normWidth)
    }

    let start = 0

    while (group.length > 1) {
      const minIndexes = group.map(poly => {
        const index = poly.str.indexOf('#', start)

        if (index === -1) {
          throw new Error('Unexpected indexOf -1 in normalize')
        }

        return index
      })


      const min = Math.min(...minIndexes)
      const max = Math.max(...minIndexes)

      if (min !== max) {
        group = group.filter((poly, index) => minIndexes[index] === min)
      }

      start = min + 1
    }

    return this.normal = group[0]
  }

  toString() {
    let s = ''

    const str = this.str.slice(0, this.origin) + '@' + this.str.slice(this.origin + 1)

    for (let i = 0; i < this.height; ++i) {
      s += str.slice(i * this.width, (i + 1) * this.width) + '\n'
    }

    return s
  }
}
