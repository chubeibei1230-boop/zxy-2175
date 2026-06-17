import React, { useState } from 'react'
import { TEMPLATE_RECOMMEND_STATUS, getGrade } from '../utils/storage'

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getRecommendBadgeClass(status) {
  switch (status) {
    case TEMPLATE_RECOMMEND_STATUS.STARRED: return 'recommend-starred'
    case TEMPLATE_RECOMMEND_STATUS.RECOMMENDED: return 'recommend-recommended'
    default: return 'recommend-normal'
  }
}

function getRecommendIcon(status) {
  switch (status) {
    case TEMPLATE_RECOMMEND_STATUS.STARRED: return '⭐'
    case TEMPLATE_RECOMMEND_STATUS.RECOMMENDED: return '👍'
    default: return ''
  }
}

export default function TemplateList({
  templates, batches, onClose, onEdit, onDelete, onDuplicate, onUse, onToggleRecommend
}) {
  const [viewingTemplate, setViewingTemplate] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [filterRecommend, setFilterRecommend] = useState('')

  const filteredTemplates = templates.filter(t => {
    if (filterText) {
      const text = filterText.toLowerCase()
      const matchName = t.name?.toLowerCase().includes(text)
      const matchBean = t.beanType?.toLowerCase().includes(text)
      const matchProcess = t.processMethod?.toLowerCase().includes(text)
      if (!matchName && !matchBean && !matchProcess) return false
    }
    if (filterRecommend && t.recommendStatus !== filterRecommend) return false
    return true
  })

  function getSourceBatchInfo(template) {
    if (!template.sourceBatchId) return null
    return batches.find(b => b.id === template.sourceBatchId) || null
  }

  function handleView(template) {
    setViewingTemplate(template)
  }

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const order = { [TEMPLATE_RECOMMEND_STATUS.STARRED]: 0, [TEMPLATE_RECOMMEND_STATUS.RECOMMENDED]: 1, [TEMPLATE_RECOMMEND_STATUS.NORMAL]: 2 }
    const statusDiff = (order[a.recommendStatus] || 2) - (order[b.recommendStatus] || 2)
    if (statusDiff !== 0) return statusDiff
    return (b.createdAt || 0) - (a.createdAt || 0)
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-template-list" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 烘焙方案模板库</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="template-toolbar">
          <div className="template-filter-group">
            <input
              type="text"
              placeholder="搜索模板名称、豆种、处理法..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="template-search-input"
            />
            <select
              value={filterRecommend}
              onChange={e => setFilterRecommend(e.target.value)}
              className="template-filter-select"
            >
              <option value="">全部推荐状态</option>
              <option value={TEMPLATE_RECOMMEND_STATUS.STARRED}>精选</option>
              <option value={TEMPLATE_RECOMMEND_STATUS.RECOMMENDED}>推荐</option>
              <option value={TEMPLATE_RECOMMEND_STATUS.NORMAL}>普通</option>
            </select>
          </div>
          <span className="template-count">共 {sortedTemplates.length} 个模板</span>
        </div>

        <div className="template-list-content">
          {sortedTemplates.length === 0 ? (
            <div className="empty-state">
              <p>暂无烘焙方案模板</p>
              <p className="empty-hint">在批次列表中，当杯测结果达到"可复用"或"建议微调"时，可将批次保存为模板</p>
            </div>
          ) : (
            <div className="template-cards">
              {sortedTemplates.map(template => {
                const grade = template.cuppingTotalScore ? getGrade(template.cuppingTotalScore) : null
                const sourceBatch = getSourceBatchInfo(template)
                return (
                  <div key={template.id} className={`template-card ${template.recommendStatus === TEMPLATE_RECOMMEND_STATUS.STARRED ? 'template-card-starred' : ''}`}>
                    <div className="template-card-header">
                      <div className="template-title-row">
                        <h3 className="template-name">{template.name || '未命名模板'}</h3>
                        <span className={`recommend-badge ${getRecommendBadgeClass(template.recommendStatus)}`}>
                          {getRecommendIcon(template.recommendStatus)} {template.recommendStatus || TEMPLATE_RECOMMEND_STATUS.NORMAL}
                        </span>
                      </div>
                      <div className="template-meta-row">
                        <span className="template-bean">
                          <strong>{template.beanType || '-'}</strong>
                          {template.processMethod && <span className="template-process"> · {template.processMethod}</span>}
                        </span>
                        {template.roastLevel && <span className="template-roast-level">{template.roastLevel}</span>}
                      </div>
                    </div>

                    <div className="template-card-body">
                      <div className="template-data-grid">
                        <div className="template-data-item">
                          <span className="template-data-label">转黄时间</span>
                          <span className="template-data-value">{template.yellowTime || '-'}</span>
                        </div>
                        <div className="template-data-item">
                          <span className="template-data-label">一爆时间</span>
                          <span className="template-data-value">{template.firstCrackTime || '-'}</span>
                        </div>
                        <div className="template-data-item">
                          <span className="template-data-label">下豆温度</span>
                          <span className="template-data-value">{template.dropTemp !== null && template.dropTemp !== undefined ? `${template.dropTemp}°C` : '-'}</span>
                        </div>
                        <div className="template-data-item">
                          <span className="template-data-label">生/熟豆重</span>
                          <span className="template-data-value">
                            {template.greenWeight !== null && template.greenWeight !== undefined ? `${template.greenWeight}g` : '-'}
                            {' / '}
                            {template.roastedWeight !== null && template.roastedWeight !== undefined ? `${template.roastedWeight}g` : '-'}
                          </span>
                        </div>
                      </div>

                      {template.cuppingTotalScore !== null && template.cuppingTotalScore !== undefined && (
                        <div className="template-score-row">
                          <span className="template-score-label">来源杯测总分</span>
                          <span className="cupping-grade-badge" style={{ background: grade?.color + '20', color: grade?.color }}>
                            {grade?.grade}
                          </span>
                          <span className="template-score-value" style={{ color: grade?.color }}>
                            {template.cuppingTotalScore}
                          </span>
                        </div>
                      )}

                      {template.flavorTarget && (
                        <div className="template-notes-section">
                          <span className="template-notes-label">风味目标</span>
                          <p className="template-notes-text">{template.flavorTarget}</p>
                        </div>
                      )}
                    </div>

                    <div className="template-card-footer">
                      <div className="template-footer-info">
                        {sourceBatch ? (
                          <span className="template-source-badge" title={`来源批次：${sourceBatch.beanType} ${sourceBatch.roastDate}`}>
                            📎 来源批次 {template.sourceBatchDate || ''}
                          </span>
                        ) : template.sourceBatchDate ? (
                          <span className="template-source-badge">
                            📎 来源批次 {template.sourceBatchDate}
                          </span>
                        ) : (
                          <span className="template-source-badge source-manual">✏️ 手动创建</span>
                        )}
                        <span className="template-use-info">
                          {template.lastUsedAt ? `最近使用: ${formatDate(template.lastUsedAt)}` : '尚未使用'}
                          {template.useCount > 0 && ` · 使用${template.useCount}次`}
                        </span>
                      </div>

                      <div className="template-card-actions">
                        <button className="btn-link" onClick={() => handleView(template)}>查看详情</button>
                        <button className="btn-link" onClick={() => onToggleRecommend(template.id)}>
                          {template.recommendStatus === TEMPLATE_RECOMMEND_STATUS.STARRED
                            ? '取消精选'
                            : template.recommendStatus === TEMPLATE_RECOMMEND_STATUS.RECOMMENDED
                              ? '设为精选'
                              : '设为推荐'}
                        </button>
                        <button className="btn-link" onClick={() => onEdit(template)}>编辑</button>
                        <button className="btn-link" onClick={() => onDuplicate(template.id)}>复制</button>
                        <button className="btn-link btn-danger" onClick={() => onDelete(template.id)}>删除</button>
                      </div>
                    </div>

                    <div className="template-use-bar">
                      <button className="btn btn-primary btn-use-template" onClick={() => onUse(template)}>
                        🚀 使用此模板新建批次
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="template-tips">💡 提示：在批次编辑时，杯测结果达标后可直接保存为模板</span>
          <button className="btn btn-cancel" onClick={onClose}>关闭</button>
        </div>

        {viewingTemplate && (
          <div className="modal-overlay" onClick={() => setViewingTemplate(null)}>
            <div className="modal modal-template-detail" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>模板详情 - {viewingTemplate.name || '未命名模板'}</h2>
                <button className="modal-close" onClick={() => setViewingTemplate(null)}>×</button>
              </div>
              <div className="template-detail-content">
                <div className="form-section">
                  <h3>基本信息</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">豆种</span><span className="detail-value">{viewingTemplate.beanType || '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">处理法</span><span className="detail-value">{viewingTemplate.processMethod || '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">烘焙程度</span><span className="detail-value">{viewingTemplate.roastLevel || '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">推荐状态</span><span className={`recommend-badge ${getRecommendBadgeClass(viewingTemplate.recommendStatus)}`}>{viewingTemplate.recommendStatus || TEMPLATE_RECOMMEND_STATUS.NORMAL}</span></div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>烘焙参数</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">转黄时间</span><span className="detail-value">{viewingTemplate.yellowTime || '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">一爆时间</span><span className="detail-value">{viewingTemplate.firstCrackTime || '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">下豆温度</span><span className="detail-value">{viewingTemplate.dropTemp !== null && viewingTemplate.dropTemp !== undefined ? `${viewingTemplate.dropTemp}°C` : '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">生豆重量</span><span className="detail-value">{viewingTemplate.greenWeight !== null && viewingTemplate.greenWeight !== undefined ? `${viewingTemplate.greenWeight}g` : '-'}</span></div>
                    <div className="detail-item"><span className="detail-label">熟豆重量</span><span className="detail-value">{viewingTemplate.roastedWeight !== null && viewingTemplate.roastedWeight !== undefined ? `${viewingTemplate.roastedWeight}g` : '-'}</span></div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>风味与杯测</h3>
                  <div className="detail-block">
                    <span className="detail-label">风味目标</span>
                    <p className="detail-text">{viewingTemplate.flavorTarget || '-'}</p>
                  </div>
                  {viewingTemplate.cuppingSnapshot && (
                    <div className="detail-block">
                      <span className="detail-label">来源杯测快照</span>
                      <div className="cupping-snapshot-grid">
                        {['aroma', 'acidity', 'sweetness', 'body', 'aftertaste', 'balance'].map(key => {
                          const labels = { aroma: '香气', acidity: '酸质', sweetness: '甜感', body: '醇厚度', aftertaste: '余韵', balance: '均衡度' }
                          return (
                            <div key={key} className="cupping-snapshot-item">
                              <span className="cupping-snapshot-label">{labels[key]}</span>
                              <span className="cupping-snapshot-value">
                                {viewingTemplate.cuppingSnapshot[key] !== null && viewingTemplate.cuppingSnapshot[key] !== undefined ? viewingTemplate.cuppingSnapshot[key] : '-'}
                              </span>
                            </div>
                          )
                        })}
                        {viewingTemplate.cuppingTotalScore !== null && viewingTemplate.cuppingTotalScore !== undefined && (
                          <div className="cupping-snapshot-item cupping-total">
                            <span className="cupping-snapshot-label">总分</span>
                            <span className="cupping-snapshot-value" style={{ color: viewingTemplate.cuppingTotalScore >= 85 ? '#2e7d32' : '#e65100', fontWeight: 700 }}>
                              {viewingTemplate.cuppingTotalScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="detail-block">
                    <span className="detail-label">复盘结论</span>
                    <p className="detail-text">{viewingTemplate.reviewConclusion || '-'}</p>
                  </div>
                  {viewingTemplate.notes && (
                    <div className="detail-block">
                      <span className="detail-label">备注</span>
                      <p className="detail-text">{viewingTemplate.notes}</p>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3>模板信息</h3>
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">来源批次</span><span className="detail-value">{viewingTemplate.sourceBatchDate ? viewingTemplate.sourceBatchDate : '手动创建'}</span></div>
                    <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDate(viewingTemplate.createdAt)}</span></div>
                    <div className="detail-item"><span className="detail-label">最近使用</span><span className="detail-value">{viewingTemplate.lastUsedAt ? formatDate(viewingTemplate.lastUsedAt) : '尚未使用'}</span></div>
                    <div className="detail-item"><span className="detail-label">使用次数</span><span className="detail-value">{viewingTemplate.useCount || 0} 次</span></div>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-cancel" onClick={() => setViewingTemplate(null)}>关闭</button>
                <button className="btn btn-primary" onClick={() => { onUse(viewingTemplate); setViewingTemplate(null) }}>使用此模板</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
