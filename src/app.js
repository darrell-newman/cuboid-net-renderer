import { createApp } from 'vue'
import { Polyomino } from './polyomino.js'
import { CuboidGeometry, OrientedCuboidSquare } from './cuboid.js'
import { assessNet, checkConnected } from './checker.js'

createApp({
  data() {
    return {
      netAscii: '',
      selectedCuboid: null,
      originCount: 0,
      highlightCorners: false,
      showOcs: false,
      flipNormal: false,
      rotateNormal: 0,
      squareSize: 20,
      showPresets: true,
      showInput: true,
      showDetails: true,
      showNormal: true,
      showOutputSettings: true,
      clses: {
        '.': 'hide',
        'x': 'face1',
        'X': 'face2',
        'y': 'face3',
        'Y': 'face4',
        'z': 'face5',
        'Z': 'face6',
      }
    }
  },

  computed: {
    cleanAscii() {
      const ascii = this.netAscii.trim()
        .replace(/@/g, '#')
        .replace(/[^#.\n]/g, '.')
        .replace(/^(\.+\n)+/, '')
        .replace(/(\n\.+)+$/, '')

      let array = ascii.split('\n')
      const width = Math.max(...array.map(line => line.length))
      array = array.map(line => line + '.'.repeat(width - line.length))

      while (array.every(line => line.startsWith('.'))) {
        array = array.map(line => line.slice(1))
      }

      while (array.every(line => line.endsWith('.'))) {
        array = array.map(line => line.slice(0, -1))
      }

      return array.join('\n')
    },

    netSize() {
      return this.cleanAscii.replace(/[^#]/g, '').length
    },

    cuboidOptions() {
      const dimensions = []

      for (let a = 1; a < this.netSize / 4; ++a) {
        for (let b = 1; b <= a; ++b) {
          for (let c = 1; c <= b; ++c) {
            if (2 * (a * b + a * c + b* c) === this.netSize) {
              dimensions.push([a, b, c])
            }
          }
        }
      }

      return dimensions
    },

    normal() {
      const ascii = this.cleanAscii || '#'
      const width = ascii.split('\n')[0].length
      const str = ascii.replace(/\n/g, '')
      const height = Math.round(str.length / width) || 0

      let normal = new Polyomino(str, width, height).normalize()

      if (this.flipNormal) {
        normal = normal.flip()
      }

      for (let rotate = this.rotateNormal; rotate > 0; rotate -= 90) {
        normal = normal.rotate90()
      }

      const originCount = this.originCount % normal.size
      let index = normal.str.indexOf('#')

      for (let i = 0; i < originCount; ++i) {
        index = normal.str.indexOf('#', index + 1)
      }

      normal.origin = index

      return normal
    },

    isConnected() {
      return checkConnected(this.normal)
    },

    isSymmetric() {
      return this.normal.equals(this.normal.rotate90().rotate90())
    },

    folding() {
      if (!this.isConnected || !this.selectedCuboid) {
        return false
      }

      const poly = this.normal
      const cuboid = new CuboidGeometry(...this.selectedCuboid)
      const ocses = OrientedCuboidSquare.forCuboidDedupe(cuboid)

      let folding = null

      for (const ocs of ocses) {
        folding = assessNet(poly, ocs)

        if (folding) {
          break
        }
      }

      return folding
    },

    foldingString() {
      const folding = this.folding

      if (!folding) {
        return ''
      }

      let s = ''
      const str = this.normal.str
      const width = this.normal.width

      for (let index = 0; index < str.length; ++index) {
        if (index % width === 0 && s) {
          s += '\n'
        }

        if (folding[index]) {
          const square = folding[index].square
          s += square[square.side] === 0 ? square.side.toUpperCase() : square.side
        } else {
          s += '.'
        }
      }

      return s
    },

    netShading() {
      const folding = this.folding

      if (!folding) {
        return null
      }

      const selectedCuboid = this.selectedCuboid

      const sideLengths = {
        x: selectedCuboid[0],
        y: selectedCuboid[1],
        z: selectedCuboid[2]
      }

      const net = []
      const str = this.normal.str
      const width = this.normal.width
      let row = null

      for (let index = 0; index < str.length; ++index) {
        if (index % width === 0) {
          row = []
          net.push(row)
        }

        if (folding[index]) {
          const square = folding[index].square
          let corner = true

          for (const side of ['x', 'y', 'z']) {
            const value = square[side]
            const sideLength = sideLengths[side]

            if (value === 0 || value === 1 || value === sideLength || value === sideLength + 1) {
              //
            } else {
              corner = false
            }
          }

          row.push({
            side: square[square.side] === 0 ? square.side.toUpperCase() : square.side,
            corner
          })
        } else {
          row.push(null)
        }
      }

      return net
    },

    originOcs() {
      const folding = this.folding

      if (!folding) {
        return ''
      }

      return this.folding[this.normal.origin]
    },

    renderSquareSize() {
      return Math.min(Math.max(3, Math.round(+this.squareSize || 1)), 100)
    }
  },

  methods: {
    async open(type, index) {
      const path = 'data/' + type + '/' + String(index).padStart(2, '0') + '.txt'

      const resp = await fetch(path)
      const text = await resp.text()

      this.netAscii = text
    },

    updateSelection() {
      if (this.cuboidOptions.length) {
        const currentStr = (this.selectedCuboid || []).join('x')
        const current = this.cuboidOptions.find(option => option.join('x') === currentStr)

        this.selectedCuboid = current || this.cuboidOptions[0]
      } else {
        this.selectedCuboid = null
      }
    }
  },

  mounted() {
    this.open('stacked', 1)
  },

  watch: {
    netSize: 'updateSelection'
  }
}).mount('#app')
