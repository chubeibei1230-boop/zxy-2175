import React from 'react'
import { validateBatch } from '../utils/storage'

export default function BatchList({
  batches, selectedIds, compareIds,
  onSelectAll, onSelect, onCompareToggle,
  onEdit, onDuplicate, onDelete
}) {
  const visibleIds = batches.map(b => b.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id))

  function getStatusClass(status) {
    switch (status) {
      case '待杯测': return 'status-pending'
      case '已杯测': return 'status-tested'
      case '需调整': return 'status-adjust'
      case '可复用': return 'status-reusable'
      default: return ''
    }
  }

  return (
    <div className="batch-list">
      {batches.length === 0 ? (
        <div className="empty-state">
          <p>暂无烘焙批次记录</p>
          <p className="empty-hint">点击「新增批次」开始记录你的第一锅咖啡</p>
        </div>
      ) : (
        <table className="batch-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onSelectAll(e.target.checked)}
                />
              </th>
              <th style={{ width: 40 }}>对比</th>
              <th>豆种</th>
              <th>处理法</th>
              <th>烘焙日期</th>
              <th>烘焙程度</th>
              <th>转黄时间</th>
              <th>一爆时间</th>
              <th>下豆温度</th>
              <th>风味描述</th>
              <th>复盘状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(batch => {
              const warnings = validateBatch(batch)
              const hasWarning = warnings.length > 0
              return (
                <tr key={batch.id} className={hasWarning ? 'has-warning' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(batch.id)}
                      onChange={e => onSelect(batch.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <button
                      className={`compare-toggle ${compareIds.includes(batch.id) ? 'active' : ''}`}
                      onClick={() => onCompareToggle(batch.id)}
                      title={compareIds.includes(batch.id) ? '取消对比' : '加入对比'}
                    >
                      {compareIds.includes(batch.id) ? '★' : '☆'}
                    </button>
                  </td>
                  <td className="bean-name">{batch.beanType || '-'}</td>
                  <td>{batch.processMethod || '-'}</td>
                  <td>{batch.roastDate || '-'}</td>
                  <td>{batch.roastLevel || '-'}</td>
                  <td>{batch.yellowTime || '-'}</td>
                  <td>{batch.firstCrackTime || '-'}</td>
                  <td>{batch.dropTemp !== null && batch.dropTemp !== undefined && batch.dropTemp !== '' ? `${batch.dropTemp}°C` : '-'}</td>
                  <td className="flavor-cell" title={batch.flavorNotes}>
                    {batch.flavorNotes || '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(batch.reviewStatus)}`}>
                      {batch.reviewStatus || '-'}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button className="btn-link" onClick={() => onEdit(batch)}>编辑</button>
                    <button className="btn-link" onClick={() => onDuplicate(batch.id)}>复制</button>
                    <button className="btn-link btn-danger" onClick={() => onDelete(batch.id)}>删除</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
