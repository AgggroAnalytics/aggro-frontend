import { onMounted, ref, watch, type Ref } from 'vue'

type Position = [number, number]
type LinearRing = Position[]
type PolygonCoordinates = LinearRing[]

export interface UseGeoPolygonCanvasOptions {
  width?: number
  height?: number
  padding?: number
  strokeStyle?: string
  fillStyle?: string
  lineWidth?: number
  backgroundColor?: string
  devicePixelRatio?: number
}

export interface UseGeoPolygonCanvasReturn {
  canvasRef: Ref<HTMLCanvasElement | null>
  redraw: () => void
  clear: () => void
}

export function useGeoPolygonCanvas(
  coordinates: Ref<PolygonCoordinates> | PolygonCoordinates,
  options: UseGeoPolygonCanvasOptions = {}
): UseGeoPolygonCanvasReturn {
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  const opts = {
    width: options.width ?? 120,
    height: options.height ?? 120,
    padding: options.padding ?? 8,
    strokeStyle: options.strokeStyle ?? '#1f2937',
    fillStyle: options.fillStyle ?? '#93c5fd',
    lineWidth: options.lineWidth ?? 1.5,
    backgroundColor: options.backgroundColor ?? 'transparent',
    devicePixelRatio:
      options.devicePixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
  }

  function unwrapCoordinates(): PolygonCoordinates {
    return Array.isArray(coordinates) ? coordinates : coordinates.value
  }

  function clear() {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function setupCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const dpr = opts.devicePixelRatio
    canvas.width = opts.width * dpr
    canvas.height = opts.height * dpr
    canvas.style.width = `${opts.width}px`
    canvas.style.height = `${opts.height}px`

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
  }

  function getBounds(polygon: PolygonCoordinates) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const ring of polygon) {
      for (const point of ring) {
        const [x, y] = point
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return null
    }

    return { minX, minY, maxX, maxY }
  }

  function createProjector(bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
    const availableWidth = Math.max(1, opts.width - opts.padding * 2)
    const availableHeight = Math.max(1, opts.height - opts.padding * 2)

    const dataWidth = Math.max(bounds.maxX - bounds.minX, 1e-9)
    const dataHeight = Math.max(bounds.maxY - bounds.minY, 1e-9)

    const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight)

    const scaledWidth = dataWidth * scale
    const scaledHeight = dataHeight * scale

    const offsetX = (opts.width - scaledWidth) / 2
    const offsetY = (opts.height - scaledHeight) / 2

    return (point: Position): Position => {
      const [x, y] = point

      // Flip Y so north/up appears visually correct for geo coords
      const projectedX = offsetX + (x - bounds.minX) * scale
      const projectedY = offsetY + (bounds.maxY - y) * scale

      return [projectedX, projectedY]
    }
  }

  function redraw() {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const polygon = unwrapCoordinates()
    clear()
    setupCanvas(canvas, ctx)

    if (!polygon.length) return

    const bounds = getBounds(polygon)
    if (!bounds) return

    if (opts.backgroundColor !== 'transparent') {
      ctx.fillStyle = opts.backgroundColor
      ctx.fillRect(0, 0, opts.width, opts.height)
    }

    const project = createProjector(bounds)

    ctx.beginPath()

    for (const ring of polygon) {
      if (!ring.length) continue

      ring.forEach((point, index) => {
        const [x, y] = project(point)
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.closePath()
    }

    ctx.fillStyle = opts.fillStyle
    ctx.strokeStyle = opts.strokeStyle
    ctx.lineWidth = opts.lineWidth
    ctx.fill('evenodd') // supports holes
    ctx.stroke()
  }

  onMounted(() => {
    redraw()
  })

  if (!Array.isArray(coordinates)) {
    watch(
      coordinates,
      () => {
        redraw()
      },
      { deep: true }
    )
  }

  return {
    canvasRef,
    redraw,
    clear,
  }
}
