import React, { useMemo } from 'react'
import { CUPPING_FIELDS, calculateTotalScore, getGrade, getReviewSuggestion } from '../utils/storage'

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
    { label: '下豆温度', key: 'dropTemp', format: v => v !== null && v !== undefined && v !== '' ? `${v}°C` : '-' },
    { label: '生豆重量', key: 'greenWeight', format: v => v !== null && v !== undefined && v !== '' ? `${v}g` : '-' },
    { label: '熟豆重量', key: 'roastedWeight', format: v => v !== null && v !== undefined && v !== '' ? `${v}g` : '-' },
    { label: '总分', key: 'cuppingTotal', format: (v, b) => {
        const s = calculateTotalScore(b.cupping)
        return s !== null ? s : '-'
      }
    },
    { label: '香气', key: 'aroma', format: (v, b) => b.cupping?.aroma !== null && b.cupping?.aroma !== undefined ? b.cupping.aroma : '-' },
    { label: '酸质', key: 'acidity', format: (v, b) => b.cupping?.acidity !== null && b.cupping?.acidity !== undefined ? b.cupping.acidity : '-' },
    { label: '甜感', key: 'sweetness', format: (v, b) => b.cupping?.sweetness !== null && b.cupping?.sweetness !== undefined ? b.cupping.sweetness : '-' },
    { label: '醇厚度', key: 'body', format: (v, b) => b.cupping?.body !== null && b.cupping?.body !== undefined ? b.cupping.body : '-' },
    { label: '余韵', key: 'aftertaste', format: (v, b) => b.cupping?.aftertaste !== null && b.cupping?.aftertaste !== undefined ? b.cupping.aftertaste : '-' },
    { label: '均衡度', key: 'balance', format: (v, b) => b.cupping?.balance !== null && b.cupping?.balance !== undefined ? b.cupping.balance : '-' },
    { label: '缺陷扣分', key: 'defectDeduction', format: (v, b) => b.cupping?.defectDeduction !== null && b.cupping?.defectDeduction !== undefined ? b.cupping.defectDeduction : '-' },
    { label: '复盘状态', key: 'reviewStatus' },
    { label: '缺陷备注', key: 'defectNotes' },
    { label: '复盘结论', key: 'reviewConclusion' }
  ]

  function getDiffClass(index, key) {
    if (batches.length < 2) return ''
    
    const cuppingKeys = ['aroma', 'acidity', 'sweetness', 'body', 'aftertaste', 'balance', 'defectDeduction', 'cuppingTotal']
    const isCuppingField = cuppingKeys.includes(key)
    
    let values
    if (isCuppingField) {
      if (key === 'cuppingTotal') {
        values = batches.map(b => calculateTotalScore(b.cupping))
      } else {
        values = batches.map(b => b.cupping?.[key])
      }
    } else {
      values = batches.map(b => b[key])
    }
    
    const unique = [...new Set(values.filter(v => v !== undefined && v !== null && v !== ''))]
    if (unique.length <= 1) return ''
    
    const numericKeys = ['dropTemp', 'yellowTime', 'firstCrackTime', 'aroma', 'acidity', 'sweetness', 'body', 'aftertaste', 'balance', 'cuppingTotal']
    if (numericKeys.includes(key) || key === 'defectDeduction') {
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
        
        if (key === 'defectDeduction') {
          if (currentNum === max) return 'val-high'
          if (currentNum === min) return 'val-low'
        } else {
          if (currentNum === min) return 'val-low'
          if (currentNum === max) return 'val-high'
        }
      }
    }
    return 'val-diff'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-compare modal-compare-wide" onClick={e => e.stopPropagation()}>
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

          <div className="cupping-compare">
            <h3>杯测评分对比</h3>
            <div className="cupping-compare-summary">
              {batches.map((b, i) => {
                const score = calculateTotalScore(b.cupping)
                const grade = getGrade(score)
                const suggestion = getReviewSuggestion(b)
                return (
                  <div key={b.id} className="cupping-summary-card">
                    <div className="cupping-summary-title">批次 {i + 1}</div>
                    <div className="cupping-summary-score" style={{ color: grade?.color }}>
                      {score !== null ? score : '-'}
                    </div>
                    {grade && (
                      <span className="cupping-grade-badge" style={{ background: grade.color + '20', color: grade.color }}>
                        {grade.grade} - {grade.label}
                      </span>
                    )}
                    {suggestion && (
                      <div className="cupping-suggestion-small">{suggestion}</div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="cupping-bars">
              {CUPPING_FIELDS.map(field => (
                <div key={field.key} className="cupping-bar-row">
                  <div className="cupping-bar-label">{field.label}</div>
                  <div className="cupping-bar-batches">
                    {batches.map((b, i) => {
                      const value = b.cupping?.[field.key]
                      const percent = value ? (value / field.max) * 100 : 0
                      const colors = ['#8b6f47', '#2e7d32', '#1565c0']
                      return (
                        <div key={b.id} className="cupping-bar-item">
                          <div className="cupping-bar-track">
                            <div
                              className="cupping-bar-fill"
                              style={{
                                width: `${percent}%`,
                                background: colors[i % colors.length]
                              }}
                            />
                          </div>
                          <div className="cupping-bar-value">
                            {value !== null && value !== undefined ? value : '-'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="cupping-compare-legend">
              {batches.map((b, i) => {
                const colors = ['#8b6f47', '#2e7d32', '#1565c0']
                return (
                  <span key={b.id} className="legend-item">
                    <span className="legend-box" style={{ background: colors[i % colors.length] }}></span>
                    批次 {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
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
