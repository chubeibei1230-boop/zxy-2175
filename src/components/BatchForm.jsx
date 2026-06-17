import React, { useState, useEffect, useMemo } from 'react'
import { CUPPING_FIELDS, calculateTotalScore, getGrade, getReviewSuggestion } from '../utils/storage'

const emptyBatch = {
  beanType: '',
  processMethod: '',
  roastDate: new Date().toISOString().split('T')[0],
  roastLevel: '',
  yellowTime: '',
  firstCrackTime: '',
  dropTemp: '',
  greenWeight: '',
  roastedWeight: '',
  flavorNotes: '',
  defectNotes: '',
  reviewStatus: '待杯测',
  reviewConclusion: '',
  cupping: {
    aroma: '',
    acidity: '',
    sweetness: '',
    body: '',
    aftertaste: '',
    balance: '',
    defectDeduction: '',
    overallNotes: ''
  }
}

export default function BatchForm({ batch, onSave, onCancel, roastLevels, statusOptions, templates = [], onOpenTemplateList }) {
  const [formData, setFormData] = useState(emptyBatch)
  const [errors, setErrors] = useState({})
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  useEffect(() => {
    if (batch) {
      setFormData({
        ...emptyBatch,
        ...batch,
        dropTemp: batch.dropTemp?.toString() || '',
        cupping: { ...emptyBatch.cupping, ...batch.cupping }
      })
      if (batch.appliedTemplateId) {
        setSelectedTemplateId(batch.appliedTemplateId)
      }
    } else {
      setFormData(emptyBatch)
      setSelectedTemplateId('')
    }
  }, [batch])

  function handleTemplateSelect(templateId) {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        beanType: template.beanType || prev.beanType,
        processMethod: template.processMethod || prev.processMethod,
        roastLevel: template.roastLevel || prev.roastLevel,
        yellowTime: template.yellowTime || prev.yellowTime,
        firstCrackTime: template.firstCrackTime || prev.firstCrackTime,
        dropTemp: template.dropTemp !== null && template.dropTemp !== undefined ? template.dropTemp : prev.dropTemp,
        greenWeight: template.greenWeight !== null && template.greenWeight !== undefined ? template.greenWeight : prev.greenWeight,
        roastedWeight: template.roastedWeight !== null && template.roastedWeight !== undefined ? template.roastedWeight : prev.roastedWeight,
        flavorNotes: template.flavorTarget || prev.flavorNotes,
        appliedTemplateId: template.id,
        appliedTemplateName: template.name
      }))
    }
  }

  function clearTemplate() {
    setSelectedTemplateId('')
    setFormData(prev => {
      const next = { ...prev }
      delete next.appliedTemplateId
      delete next.appliedTemplateName
      return next
    })
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handleCuppingChange(field, value) {
    setFormData(prev => ({
      ...prev,
      cupping: { ...prev.cupping, [field]: value }
    }))
  }

  const totalScore = useMemo(() => calculateTotalScore(formData.cupping), [formData.cupping])
  const grade = useMemo(() => getGrade(totalScore), [totalScore])
  const suggestion = useMemo(() => getReviewSuggestion(formData), [formData])

  function getSuggestionClass(suggestion) {
    switch (suggestion) {
      case '可复用': return 'reusable'
      case '建议微调': return 'adjust'
      case '需要重烘': return 'reroast'
      default: return ''
    }
  }

  function validate() {
    const errs = {}
    if (!formData.beanType?.trim()) {
      errs.beanType = '请输入豆种名称'
    }
    if (!formData.roastDate) {
      errs.roastDate = '请选择烘焙日期'
    }
    if (formData.dropTemp && isNaN(Number(formData.dropTemp))) {
      errs.dropTemp = '下豆温度必须是数字'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const cuppingData = {}
    CUPPING_FIELDS.forEach(f => {
      const val = formData.cupping[f.key]
      cuppingData[f.key] = val !== '' ? Number(val) : null
    })
    cuppingData.defectDeduction = formData.cupping.defectDeduction !== '' ? Number(formData.cupping.defectDeduction) : null
    cuppingData.overallNotes = formData.cupping.overallNotes || ''

    const data = {
      ...formData,
      dropTemp: formData.dropTemp !== '' ? Number(formData.dropTemp) : null,
      greenWeight: formData.greenWeight !== '' ? Number(formData.greenWeight) : null,
      roastedWeight: formData.roastedWeight !== '' ? Number(formData.roastedWeight) : null,
      cupping: cuppingData
    }
    onSave(data)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-form" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{batch ? '编辑批次' : '新增批次'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form className="batch-form" onSubmit={handleSubmit}>
          {!batch && (
            <div className="template-apply-section">
              <div className="template-apply-header">
                <span className="template-apply-icon">📋</span>
                <span className="template-apply-title">从模板快速带入</span>
              </div>
              <div className="template-apply-row">
                <select
                  value={selectedTemplateId}
                  onChange={e => handleTemplateSelect(e.target.value)}
                  className="template-select"
                >
                  <option value="">-- 选择烘焙方案模板 --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.recommendStatus === '精选' ? '⭐ ' : t.recommendStatus === '推荐' ? '👍 ' : ''}
                      {t.name || '未命名模板'} - {t.beanType || '未指定豆种'}
                    </option>
                  ))}
                </select>
                {onOpenTemplateList && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onOpenTemplateList}
                  >
                    浏览模板库
                  </button>
                )}
                {selectedTemplateId && (
                  <button
                    type="button"
                    className="btn btn-cancel btn-sm"
                    onClick={clearTemplate}
                  >
                    清除模板
                  </button>
                )}
              </div>
              {formData.appliedTemplateName && (
                <div className="template-applied-banner">
                  <span className="template-applied-check">✓</span>
                  <span>
                    已应用模板「<strong>{formData.appliedTemplateName}</strong>」，参数已填入，您可以在保存前自由调整
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="form-section">
            <h3>基本信息</h3>
            <div className="form-row">
              <div className="form-group">
                <label>豆种名称 *</label>
                <input
                  type="text"
                  value={formData.beanType}
                  onChange={e => handleChange('beanType', e.target.value)}
                  placeholder="如：埃塞俄比亚 耶加雪菲"
                  className={errors.beanType ? 'input-error' : ''}
                />
                {errors.beanType && <span className="error-text">{errors.beanType}</span>}
              </div>
              <div className="form-group">
                <label>处理法</label>
                <input
                  type="text"
                  value={formData.processMethod}
                  onChange={e => handleChange('processMethod', e.target.value)}
                  placeholder="如：水洗、日晒、蜜处理"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>烘焙日期 *</label>
                <input
                  type="date"
                  value={formData.roastDate}
                  onChange={e => handleChange('roastDate', e.target.value)}
                  className={errors.roastDate ? 'input-error' : ''}
                />
                {errors.roastDate && <span className="error-text">{errors.roastDate}</span>}
              </div>
              <div className="form-group">
                <label>烘焙程度</label>
                <select
                  value={formData.roastLevel}
                  onChange={e => handleChange('roastLevel', e.target.value)}
                >
                  <option value="">请选择</option>
                  {roastLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>烘焙数据</h3>
            <div className="form-row">
              <div className="form-group">
                <label>转黄时间（分:秒）</label>
                <input
                  type="text"
                  value={formData.yellowTime}
                  onChange={e => handleChange('yellowTime', e.target.value)}
                  placeholder="如：5:30"
                />
              </div>
              <div className="form-group">
                <label>一爆时间（分:秒）</label>
                <input
                  type="text"
                  value={formData.firstCrackTime}
                  onChange={e => handleChange('firstCrackTime', e.target.value)}
                  placeholder="如：9:15"
                />
              </div>
              <div className="form-group">
                <label>下豆温度（°C）</label>
                <input
                  type="number"
                  value={formData.dropTemp}
                  onChange={e => handleChange('dropTemp', e.target.value)}
                  placeholder="如：205"
                  className={errors.dropTemp ? 'input-error' : ''}
                />
                {errors.dropTemp && <span className="error-text">{errors.dropTemp}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>生豆重量（g）</label>
                <input
                  type="number"
                  value={formData.greenWeight}
                  onChange={e => handleChange('greenWeight', e.target.value)}
                  placeholder="如：200"
                />
              </div>
              <div className="form-group">
                <label>熟豆重量（g）</label>
                <input
                  type="number"
                  value={formData.roastedWeight}
                  onChange={e => handleChange('roastedWeight', e.target.value)}
                  placeholder="如：170"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>风味记录</h3>
            <div className="form-group">
              <label>风味描述</label>
              <textarea
                rows={2}
                value={formData.flavorNotes}
                onChange={e => handleChange('flavorNotes', e.target.value)}
                placeholder="描述咖啡的风味特点，如：柠檬酸质明亮，花香明显，尾韵悠长..."
              />
            </div>
            <div className="form-group">
              <label>缺陷备注</label>
              <textarea
                rows={2}
                value={formData.defectNotes}
                onChange={e => handleChange('defectNotes', e.target.value)}
                placeholder="记录发现的缺陷，如：焦苦味、涩感、发展不足..."
              />
            </div>
          </div>

          <div className="form-section">
            <h3>杯测评分</h3>
            <div className="cupping-score-summary">
              <div className="cupping-summary-item">
                <span className="cupping-summary-label">总分</span>
                <span className="cupping-summary-value">{totalScore !== null ? totalScore : '-'}</span>
              </div>
              {grade && (
                <div className="cupping-summary-item">
                  <span className="cupping-summary-label">等级</span>
                  <span className="cupping-grade-badge" style={{ background: grade.color + '20', color: grade.color }}>
                    {grade.grade} - {grade.label}
                  </span>
                </div>
              )}
              {suggestion && (
                <div className="cupping-summary-item">
                  <span className="cupping-summary-label">建议</span>
                  <span className={`cupping-suggestion-badge suggestion-${getSuggestionClass(suggestion)}`}>
                    {suggestion}
                  </span>
                </div>
              )}
            </div>

            <div className="cupping-fields-grid">
              {CUPPING_FIELDS.map(field => (
                <div key={field.key} className="form-group cupping-field">
                  <label>{field.label} (0-10)</label>
                  <div className="cupping-input-wrapper">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={formData.cupping[field.key] !== '' && formData.cupping[field.key] !== null ? formData.cupping[field.key] : 0}
                      onChange={e => handleCuppingChange(field.key, e.target.value)}
                      className="cupping-slider"
                    />
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={formData.cupping[field.key] !== null && formData.cupping[field.key] !== undefined ? formData.cupping[field.key] : ''}
                      onChange={e => handleCuppingChange(field.key, e.target.value)}
                      className="cupping-number-input"
                      placeholder="--"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>缺陷扣分 (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={formData.cupping.defectDeduction !== null && formData.cupping.defectDeduction !== undefined ? formData.cupping.defectDeduction : ''}
                  onChange={e => handleCuppingChange('defectDeduction', e.target.value)}
                  placeholder="如缺陷明显可适当扣分"
                />
              </div>
              <div className="form-group">
                <label>复盘状态</label>
                <select
                  value={formData.reviewStatus}
                  onChange={e => handleChange('reviewStatus', e.target.value)}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>杯测总评</label>
              <textarea
                rows={2}
                value={formData.cupping.overallNotes || ''}
                onChange={e => handleCuppingChange('overallNotes', e.target.value)}
                placeholder="对本次杯测的整体评价..."
              />
            </div>

            <div className="form-group">
              <label>复盘结论</label>
              <textarea
                rows={3}
                value={formData.reviewConclusion}
                onChange={e => handleChange('reviewConclusion', e.target.value)}
                placeholder="总结本次烘焙的优缺点，以及下次调整方向..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
