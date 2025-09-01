import { useLatest } from '../../data/seriesStore'

export default function HeapGauge() {
  const ua = useLatest('memory.ua.mb')
  const heapUsed = useLatest('memory.heap.used_mb')

  const value = ua?.v ?? heapUsed?.v
  const supported = typeof value === 'number' && Number.isFinite(value)

  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#444' }
  const numStyle: React.CSSProperties = {
    fontSize: 24,
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum" 1',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: '#111',
  }

  return (
    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#111' }}>
      <div style={labelStyle}>Heap (MB)</div>
      <div style={numStyle}>{supported ? (value as number).toFixed(1) : 'N/A'}</div>
      <div style={{ ...labelStyle, marginTop: 4, color: '#777' }}>
        {ua ? 'UA memory' : heapUsed ? 'Heap (experimental)' : 'Unsupported'}
      </div>
    </div>
  )
}

