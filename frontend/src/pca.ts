/**
 * PCA projection: reduces high-dimensional vectors to 3D for Three.js visualization.
 * Pure JS implementation — no external dependencies needed.
 */

type Matrix = number[][]

function transpose(m: Matrix): Matrix {
  return m[0].map((_, i) => m.map(row => row[i]))
}

function matMul(a: Matrix, b: Matrix): Matrix {
  return a.map(row =>
    b[0].map((_, j) => row.reduce((sum, val, k) => sum + val * b[k][j], 0))
  )
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function subtract(m: Matrix, means: number[]): Matrix {
  return m.map(row => row.map((val, j) => val - means[j]))
}

/**
 * Power iteration to find approximate top-k eigenvectors.
 * Good enough for visualization purposes.
 */
function powerIteration(matrix: Matrix, numComponents: number, iterations = 50): Matrix {
  const n = matrix[0].length
  const components: number[][] = []

  // Covariance matrix (simplified: X^T X / n)
  const XT = transpose(matrix)
  const cov = matMul(XT, matrix).map(row => row.map(v => v / matrix.length))

  // Deflation: find top eigenvectors one by one
  let deflated = cov.map(row => [...row])

  for (let c = 0; c < numComponents; c++) {
    // Random init
    let v = Array.from({ length: n }, () => Math.random() - 0.5)
    let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
    v = v.map(x => x / norm)

    for (let iter = 0; iter < iterations; iter++) {
      // v = cov * v
      const newV = deflated.map(row => row.reduce((s, val, i) => s + val * v[i], 0))
      norm = Math.sqrt(newV.reduce((s, x) => s + x * x, 0))
      v = newV.map(x => x / (norm || 1))
    }

    components.push(v)

    // Deflate: remove this component from covariance
    const vv = v.map((vi, i) => v.map(vj => vi * vj))
    const eigenval = v.reduce((s, vi, i) => s + vi * deflated[i].reduce((ss, vij, j) => ss + vij * v[j], 0), 0)
    deflated = deflated.map((row, i) => row.map((val, j) => val - eigenval * vv[i][j]))
  }

  return components
}

/**
 * Project N high-dimensional vectors to 3D using PCA.
 * Returns array of [x, y, z] coordinates.
 */
export function projectToPCA3D(vectors: number[][]): [number, number, number][] {
  if (vectors.length === 0) return []
  if (vectors.length === 1) return [[0, 0, 0]]

  const dims = vectors[0].length

  // Center the data
  const means = Array.from({ length: dims }, (_, j) => mean(vectors.map(v => v[j])))
  const centered = subtract(vectors, means)

  // Get top 3 principal components
  const numComponents = Math.min(3, vectors.length - 1, dims)
  const components = powerIteration(centered, numComponents)

  // Project
  return centered.map(row => {
    const coords: [number, number, number] = [0, 0, 0]
    components.forEach((comp, i) => {
      if (i < 3) {
        coords[i] = row.reduce((s, val, j) => s + val * comp[j], 0)
      }
    })
    return coords
  })
}
