import React, { useState, useMemo } from 'react'
import {
  getInsightStats,
  getSuggestionDistribution,
  getCommonIssues,
  getGroupedByBeanType,
  getGroupedByRoastLevel,
  getScoreDistribution,
  findRecommendedTemplates,
  calculateTotalScore,
  getGrade,
  REVIEW_SUGGESTIONS,
  ROAST_LEVELS,
  REVIEW_STATUS
} from '../utils/storage'

export default function InsightPanel({
  batches,
  templates,
  beanTypes,
  onClose,
  onViewBatches,
  onStartCompare,
  onSaveAsTemplate,
  onUseTemplate,
  onOpenTemplateList
}) {
  const [filters, setFilters] = useState({
    beanType: '',
    roastLevel: '',
    dateFrom: '',
    dateTo: ''
  })

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleResetFilters() {
    setFilters({ beanType: '', roastLevel: '', dateFrom: '', dateTo: '' })
  }

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (filters.beanType && !b.beanType?.includes(filters.beanType)) return false
      if (filters.dateFrom && b.roastDate < filters.dateFrom) return false
      if (filters.dateTo && b.roastDate > filters.dateTo) return false
      if (filters.roastLevel && b.roastLevel !== filters.roastLevel) return false
      return true
    })
  }, [batches, filters])

  const stats = useMemo(() => getInsightStats(filteredBatches), [filteredBatches])
  const distribution = useMemo(() => getSuggestionDistribution(filteredBatches), [filteredBatches])
  const issues = useMemo(() => getCommonIssues(filteredBatches), [filteredBatches])
  const byBeanType = useMemo(() => getGroupedByBeanType(filteredBatches), [filteredBatches])
  const byRoastLevel = useMemo(() => getGroupedByRoastLevel(filteredBatches), [filteredBatches])
  const scoreDist = useMemo(() => getScoreDistribution(filteredBatches), [filteredBatches])
  const recommended = useMemo(() => findRecommendedTemplates(templates, filteredBatches), [templates, filteredBatches])

  function handleViewBatchList(ids) {
    onViewBatches && onViewBatches(ids)
    onClose && onClose()
  }

  function handleCompareBatches(batchesToCompare) {
    const ids = batchesToCompare.slice(0, 3).map(b => b.id)
    onStartCompare && onStartCompare(ids)
    onClose && onClose()
  }

  function handleSaveBatchAsTemplate(batch) {
    onSaveAsTemplate && onSaveAsTemplate(batch)
    onClose && onClose()
  }

  function handleApplyTemplate(template) {
    onUseTemplate && onUseTemplate(template)
    onClose && onClose()
  }

  const totalWithSuggestion = distribution.reusable.length + distribution.adjust.length + distribution.reRoast.length
  const reusablePct = totalWithSuggestion > 0 ? Math.round((distribution.reusable.length / totalWithSuggestion) * 100) : 0
  const adjustPct = totalWithSuggestion > 0 ? Math.round((distribution.adjust.length / totalWithSuggestion) * 100) : 0
  const reRoastPct = totalWithSuggestion > 0 ? Math.round((distribution.reRoast.length / totalWithSuggestion) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-insight" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 烘焙复盘洞察</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="insight-filters">
          <div className="filter-item">
            <label>豆种</label>
            <select value={filters.beanType} onChange={e => handleFilterChange('beanType', e.target.value)}>
              <option value="">全部</option>
              {beanTypes.map(bt => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>烘焙程度</label>
            <select value={filters.roastLevel} onChange={e => handleFilterChange('roastLevel', e.target.value)}>
              <option value="">全部</option>
              {ROAST_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>日期起</label>
            <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} />
          </div>
          <div className="filter-item">
            <label>日期止</label>
            <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} />
          </div>
          <div className="filter-item">
            <button className="btn btn-reset" onClick={handleResetFilters}>重置</button>
          </div>
        </div>

        <div className="insight-content">
          <div className="insight-section">
            <h3 className="insight-section-title">📈 关键指标概览</h3>
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">总批次数</div>
              </div>
              <div className="stat-card stat-tested">
                <div className="stat-value">{stats.testedCount}</div>
                <div className="stat-label">已杯测批次</div>
              </div>
              <div className="stat-card stat-avg">
                <div className="stat-value">
                  {stats.avgScore !== null ? stats.avgScore : '-'}
                  {stats.avgScore !== null && <span className="stat-unit">分</span>}
                </div>
                <div className="stat-label">平均杯测分</div>
              </div>
              <div className="stat-card stat-reusable">
                <div className="stat-value">{stats.reusableCount}</div>
                <div className="stat-label">可复用批次</div>
              </div>
              <div className="stat-card stat-adjust">
                <div className="stat-value">{stats.adjustCount}</div>
                <div className="stat-label">需调整批次</div>
              </div>
              <div className="stat-card stat-pending">
                <div className="stat-value">{stats.pendingCount}</div>
                <div className="stat-label">待评分批次</div>
              </div>
            </div>
          </div>

          <div className="insight-section">
            <h3 className="insight-section-title">🎯 批次表现分布</h3>
            {totalWithSuggestion > 0 ? (
              <>
                <div className="distribution-bar">
                  <div
                    className="dist-segment dist-reusable"
                    style={{ width: `${reusablePct}%` }}
                    title={`可复用 ${distribution.reusable.length} 个 (${reusablePct}%)`}
                  />
                  <div
                    className="dist-segment dist-adjust"
                    style={{ width: `${adjustPct}%` }}
                    title={`建议微调 ${distribution.adjust.length} 个 (${adjustPct}%)`}
                  />
                  <div
                    className="dist-segment dist-reroast"
                    style={{ width: `${reRoastPct}%` }}
                    title={`需要重烘 ${distribution.reRoast.length} 个 (${reRoastPct}%)`}
                  />
                </div>
                <div className="distribution-legend">
                  <div className="legend-item">
                    <span className="legend-box legend-reusable" />
                    <span>表现优秀（可复用）{distribution.reusable.length} 个</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-box legend-adjust" />
                    <span>建议微调 {distribution.adjust.length} 个</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-box legend-reroast" />
                    <span>需要重烘 {distribution.reRoast.length} 个</span>
                  </div>
                </div>

                <div className="batch-group-actions">
                  {distribution.reusable.length > 0 && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleViewBatchList(distribution.reusable.map(b => b.id))}
                    >
                      查看优秀批次 ({distribution.reusable.length})
                    </button>
                  )}
                  {distribution.reusable.length >= 2 && distribution.reusable.length <= 3 && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCompareBatches(distribution.reusable)}
                    >
                      对比优秀批次
                    </button>
                  )}
                  {distribution.adjust.length > 0 && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleViewBatchList(distribution.adjust.map(b => b.id))}
                    >
                      查看需微调批次 ({distribution.adjust.length})
                    </button>
                  )}
                  {distribution.reRoast.length > 0 && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleViewBatchList(distribution.reRoast.map(b => b.id))}
                    >
                      查看需重烘批次 ({distribution.reRoast.length})
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-insight">暂无可分析的评分数据，完成杯测评分后可查看分布</div>
            )}
          </div>

          {issues.length > 0 && (
            <div className="insight-section">
              <h3 className="insight-section-title">⚠️ 常见问题提醒</h3>
              <div className="issues-list">
                {issues.map((issue, idx) => (
                  <div key={idx} className={`issue-card issue-${issue.level}`}>
                    <div className="issue-header">
                      <span className="issue-icon">
                        {issue.level === 'error' ? '🔴' : issue.level === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <span className="issue-title">{issue.title}</span>
                    </div>
                    <div className="issue-message">{issue.message}</div>
                    {issue.batchIds && issue.batchIds.length > 0 && (
                      <button
                        className="btn btn-sm btn-link issue-action"
                        onClick={() => handleViewBatchList(issue.batchIds)}
                      >
                        查看相关批次 ({issue.batchIds.length})
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="insight-row">
            <div className="insight-section flex-1">
              <h3 className="insight-section-title">🫘 按豆种统计</h3>
              {byBeanType.length > 0 ? (
                <div className="group-table-wrapper">
                  <table className="group-table">
                    <thead>
                      <tr>
                        <th>豆种</th>
                        <th>批次</th>
                        <th>平均分</th>
                        <th>可复用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byBeanType.map(item => (
                        <tr key={item.beanType}>
                          <td className="group-name">{item.beanType}</td>
                          <td>{item.count}</td>
                          <td>
                            {item.avgScore !== null ? (
                              <span style={{ color: getGrade(item.avgScore)?.color, fontWeight: 600 }}>
                                {item.avgScore}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            {item.reusable > 0 ? (
                              <span className="badge-green">{item.reusable}</span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-insight">暂无数据</div>
              )}
            </div>

            <div className="insight-section flex-1">
              <h3 className="insight-section-title">🔥 按烘焙程度统计</h3>
              {byRoastLevel.some(item => item.count > 0) ? (
                <div className="group-table-wrapper">
                  <table className="group-table">
                    <thead>
                      <tr>
                        <th>烘焙度</th>
                        <th>批次</th>
                        <th>平均分</th>
                        <th>可复用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byRoastLevel.filter(item => item.count > 0).map(item => (
                        <tr key={item.roastLevel}>
                          <td className="group-name">{item.roastLevel}</td>
                          <td>{item.count}</td>
                          <td>
                            {item.avgScore !== null ? (
                              <span style={{ color: getGrade(item.avgScore)?.color, fontWeight: 600 }}>
                                {item.avgScore}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            {item.reusable > 0 ? (
                              <span className="badge-green">{item.reusable}</span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-insight">暂无数据</div>
              )}
            </div>
          </div>

          <div className="insight-section">
            <h3 className="insight-section-title">🏆 评分等级分布</h3>
            {stats.scoredCount > 0 ? (
              <div className="score-distribution">
                {scoreDist.map(item => (
                  <div key={item.grade} className="score-dist-item">
                    <div className="score-dist-label" style={{ color: item.color }}>
                      {item.grade} - {item.label}
                    </div>
                    <div className="score-dist-bar-track">
                      <div
                        className="score-dist-bar-fill"
                        style={{
                          width: `${stats.scoredCount > 0 ? Math.round((item.count / stats.scoredCount) * 100) : 0}%`,
                          background: item.color
                        }}
                      />
                    </div>
                    <div className="score-dist-count">{item.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-insight">暂无评分数据</div>
            )}
          </div>

          <div className="insight-section">
            <h3 className="insight-section-title">🚀 下一步操作建议</h3>
            <div className="next-actions">
              {recommended.topReusableBatches.length > 0 && (
                <div className="action-card">
                  <div className="action-card-title">⭐ 表现优秀的批次</div>
                  <div className="action-card-desc">这些批次评分高、缺陷少，推荐保存为模板</div>
                  <div className="action-batch-list">
                    {recommended.topReusableBatches.map(batch => {
                      const score = calculateTotalScore(batch.cupping)
                      const grade = getGrade(score)
                      return (
                        <div key={batch.id} className="action-batch-item">
                          <div className="action-batch-info">
                            <span className="action-batch-name">{batch.beanType || '未命名'}</span>
                            <span className="action-batch-score" style={{ color: grade?.color }}>
                              {score}分 {grade?.grade}
                            </span>
                          </div>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSaveBatchAsTemplate(batch)}
                          >
                            存为模板
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(recommended.starred.length > 0 || recommended.recommended.length > 0) && (
                <div className="action-card">
                  <div className="action-card-title">📋 推荐模板</div>
                  <div className="action-card-desc">使用已有优秀模板快速创建新批次</div>
                  <div className="action-template-list">
                    {[...recommended.starred, ...recommended.recommended].slice(0, 3).map(template => (
                      <div key={template.id} className="action-batch-item">
                        <div className="action-batch-info">
                          <span className="action-batch-name">{template.name}</span>
                          <span className="action-batch-meta">
                            {template.beanType} · {template.roastLevel}
                            {template.recommendStatus === '精选' && ' ⭐'}
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleApplyTemplate(template)}
                        >
                          用此模板
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => { onOpenTemplateList && onOpenTemplateList(); onClose && onClose() }}
                    style={{ marginTop: 8 }}
                  >
                    查看全部模板
                  </button>
                </div>
              )}

              <div className="action-card">
                <div className="action-card-title">📊 批次对比分析</div>
                <div className="action-card-desc">选择多个批次进行横向对比，找出最佳参数</div>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => { onClose && onClose() }}
                >
                  返回列表选择对比
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
