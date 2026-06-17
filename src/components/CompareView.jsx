import React, { useMemo } from 'react'

export default function CompareView({ batches, onClose }) {
  const flavorKeywords = useMemo(() => {
    const allKeywords = new Set()
    batches.forEach(b => {
      if (b.flavorNotes) {
        b.flavorNotes.split(/[，,、\s]+/).filter(Boolean).forEach(kw => allKeywords.add(kw.trim()))
      }
    })
    return Array.from(allKeywords)
  }, [batches])

  function hasFlavor(batch, keyword) {
    if (!batch.flavorNotes) return false
    return batch.flavorNotes.includes(keyword)
  }

  const compareFields = [
    { label: '豆种', key: 'beanType' },
    { label: '处理法', key: 'processMethod' },
    { label: '烘焙日期', key: 'roastDate' },
    { label: '烘焙程度', key: 'roastLevel' },
    { label: '转黄时间', key: 'yellowTime' },
    { label: '一爆时间', key: 'firstCrackTime' },
    { label: '下豆温度', key: 'dropTemp', format: v => v ? `${v}°C` : '-' },
    { label: '生豆重量', key: 'greenWeight', format: v => v ? `${v}g` : '-' },
    { label: '熟豆重量', key: 'roastedWeight', format: v => v ? `${v}g` : '-' },
    { label: '复盘状态', key: 'reviewStatus' },
    { label: '缺陷备注', key: 'defectNotes' },
    { label: '复盘结论', key: 'reviewConclusion' }
  ]

  function getDiffClass(index, key) {
    if (batches.length < 2) return ''
    const values = batches.map(b => b[key])
    const unique = [...new Set(values.filter(v => v !== undefined && v !== null && v !== ''))]
    if (unique.length <= 1) return ''
    if (key === 'dropTemp' || key === 'yellowTime' || key === 'firstCrackTime') {
      const nums = values.map(v => {
        if (typeof v === 'number') return v
        if (typeof v === 'string' && v.includes(':')) {
          const parts = v.split(':')
          return parseInt(parts[0]) * 60 + parseInt(parts[1])
        }
        return parseFloat(v)
      }).filter(n => !isNaN(n))
      if (nums.length >= 2) {
        const min = Math.min(...nums)
        const max = Math.max(...nums)
        const current = values[index]
        const currentNum = typeof current === 'number' ? current :
          (typeof current === 'string' && current.includes(':')) ?
            (parseInt(current.split(':')[0]) * 60 + parseInt(current.split(':')[1])) :
            parseFloat(current)
        if (currentNum === min) return 'val-low'
        if (currentNum === max) return 'val-high'
      }
    }
    return 'val-diff'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-compare" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>批次对比</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="compare-content">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-label-col">对比项</th>
                {batches.map((b, i) => (
                  <th key={b.id} className={`compare-col-${i + 1}`}>
                    批次 {i + 1}
                    <div className="compare-subtitle">{b.beanType || '未命名'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map(field => (
                <tr key={field.key}>
                  <td className="compare-label">{field.label}</td>
                  {batches.map((b, i) => (
                    <td key={b.id} className={getDiffClass(i, field.key)}>
                      {field.format ? field.format(b[field.key]) : (b[field.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {flavorKeywords.length > 0 && (
            <div className="flavor-compare">
              <h3>风味词对比</h3>
              <div className="flavor-tags-compare">
                {flavorKeywords.map(kw => (
                  <div key={kw} className="flavor-keyword-row">
                    <span className="flavor-keyword">{kw}</span>
                    <div className="flavor-keyword-batches">
                      {batches.map(b => (
                        <span
                          key={b.id}
                          className={`flavor-dot ${hasFlavor(b, kw) ? 'has' : 'no'}`}
                          title={hasFlavor(b, kw) ? '包含' : '不包含'}
                        >
                          {hasFlavor(b, kw) ? '✓' : '-'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="compare-legend">
            <span className="legend-item"><span className="val-low legend-box"></span> 最低值</span>
            <span className="legend-item"><span className="val-high legend-box"></span> 最高值</span>
            <span className="legend-item"><span className="val-diff legend-box"></span> 有差异</span>
          </div>
          <button className="btn btn-primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
