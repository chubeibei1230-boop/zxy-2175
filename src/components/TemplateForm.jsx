import React, { useState, useEffect, useMemo } from 'react'
import { CUPPING_FIELDS, calculateTotalScore, getGrade, TEMPLATE_RECOMMEND_STATUS } from '../utils/storage'

const emptyTemplate = {
  name: '',
  beanType: '',
  processMethod: '',
  roastLevel: '',
  yellowTime: '',
  firstCrackTime: '',
  dropTemp: '',
  greenWeight: '',
  roastedWeight: '',
  flavorTarget: '',
  cuppingSnapshot: null,
  cuppingTotalScore: null,
  reviewConclusion: '',
  sourceBatchId: null,
  sourceBatchDate: null,
  recommendStatus: TEMPLATE_RECOMMEND_STATUS.NORMAL,
  notes: ''
}

export default function TemplateForm({
  template, sourceBatch, onSave, onCancel, roastLevels, isFromBatch = false
}) {
  const [formData, setFormData] = useState(emptyTemplate)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (template) {
      setFormData({
        ...emptyTemplate,
        ...template,
        dropTemp: template.dropTemp?.toString() || '',
        greenWeight: template.greenWeight?.toString() || '',
        roastedWeight: template.roastedWeight?.toString() || '',
        cuppingSnapshot: template.cuppingSnapshot ? { ...template.cuppingSnapshot } : null
      })
    } else {
      setFormData(emptyTemplate)
    }
  }, [template])

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

  const totalScore = useMemo(() => {
    if (formData.cuppingSnapshot) {
      return calculateTotalScore(formData.cuppingSnapshot)
    }
    return null
  }, [formData.cuppingSnapshot])

  const grade = useMemo(() => getGrade(totalScore), [totalScore])

  function validate() {
    const errs = {}
    if (!formData.name?.trim()) {
      errs.name = '请输入模板名称'
    }
    if (!formData.beanType?.trim()) {
      errs.beanType = '请输入豆种名称'
    }
    if (!formData.roastLevel?.trim()) {
      errs.roastLevel = '请选择烘焙程度'
    }
    if (!formData.yellowTime?.trim() && !formData.firstCrackTime?.trim()) {
      errs.yellowTime = '至少填写转黄时间或一爆时间其中之一'
    }
    if (formData.dropTemp === '' || formData.dropTemp === null || formData.dropTemp === undefined) {
      errs.dropTemp = '请填写下豆温度'
    }
    if (formData.dropTemp && isNaN(Number(formData.dropTemp))) {
      errs.dropTemp = '下豆温度必须是数字'
    }
    if (!formData.flavorTarget?.trim()) {
      errs.flavorTarget = '请描述风味目标'
    }
    if (!formData.reviewConclusion?.trim()) {
      errs.reviewConclusion = '请填写复盘结论，沉淀可复用的关键经验'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const data = {
      ...formData,
      dropTemp: formData.dropTemp !== '' ? Number(formData.dropTemp) : null,
      greenWeight: formData.greenWeight !== '' ? Number(formData.greenWeight) : null,
      roastedWeight: formData.roastedWeight !== '' ? Number(formData.roastedWeight) : null,
      cuppingTotalScore: totalScore
    }
    onSave(data)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-form" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isFromBatch ? '保存批次为模板' : (template ? '编辑模板' : '新增模板')}
          </h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form className="batch-form" onSubmit={handleSubmit}>
          {isFromBatch && sourceBatch && (
            <div className="template-source-banner">
              <span className="source-banner-icon">📎</span>
              <span className="source-banner-text">
                正在将批次「{sourceBatch.beanType} {sourceBatch.roastDate}」保存为模板，模板参数已自动填入，可调整后保存
              </span>
            </div>
          )}

          <div className="form-section">
            <h3>模板信息</h3>
            <div className="form-row">
              <div className="form-group">
                <label>模板名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="给这个烘焙方案起个易记的名字"
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>推荐状态</label>
                <select
                  value={formData.recommendStatus || TEMPLATE_RECOMMEND_STATUS.NORMAL}
                  onChange={e => handleChange('recommendStatus', e.target.value)}
                >
                  <option value={TEMPLATE_RECOMMEND_STATUS.NORMAL}>普通</option>
                  <option value={TEMPLATE_RECOMMEND_STATUS.RECOMMENDED}>推荐</option>
                  <option value={TEMPLATE_RECOMMEND_STATUS.STARRED}>精选 ⭐</option>
                </select>
              </div>
            </div>
          </div>

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

          <div className="form-section">
            <h3>烘焙参数</h3>
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
            <h3>风味与复盘</h3>
            <div className="form-group">
              <label>风味目标</label>
              <textarea
                rows={2}
                value={formData.flavorTarget}
                onChange={e => handleChange('flavorTarget', e.target.value)}
                placeholder="描述预期的风味特点，如：柠檬酸质明亮，花香明显，尾韵悠长..."
              />
            </div>

            {formData.cuppingSnapshot && (
              <div className="cupping-snapshot-section">
                <div className="cupping-snapshot-header">
                  <span>📊 来源杯测快照</span>
                  {totalScore !== null && grade && (
                    <div className="cupping-snapshot-score">
                      <span className="cupping-grade-badge" style={{ background: grade.color + '20', color: grade.color }}>
                        {grade.grade} - {grade.label}
                      </span>
                      <span className="template-score-value" style={{ color: grade.color, fontWeight: 700 }}>
                        总分 {totalScore}
                      </span>
                    </div>
                  )}
                </div>
                <div className="cupping-snapshot-grid">
                  {CUPPING_FIELDS.map(field => (
                    <div key={field.key} className="cupping-snapshot-item">
                      <span className="cupping-snapshot-label">{field.label}</span>
                      <span className="cupping-snapshot-value">
                        {formData.cuppingSnapshot[field.key] !== null && formData.cuppingSnapshot[field.key] !== undefined
                          ? formData.cuppingSnapshot[field.key]
                          : '-'}
                      </span>
                    </div>
                  ))}
                  <div className="cupping-snapshot-item">
                    <span className="cupping-snapshot-label">缺陷扣分</span>
                    <span className="cupping-snapshot-value">
                      {formData.cuppingSnapshot.defectDeduction !== null && formData.cuppingSnapshot.defectDeduction !== undefined
                        ? formData.cuppingSnapshot.defectDeduction
                        : '-'}
                    </span>
                  </div>
                </div>
                {formData.cuppingSnapshot.overallNotes && (
                  <div className="cupping-snapshot-notes">
                    <span className="cupping-snapshot-label">杯测总评</span>
                    <p>{formData.cuppingSnapshot.overallNotes}</p>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>复盘结论</label>
              <textarea
                rows={3}
                value={formData.reviewConclusion}
                onChange={e => handleChange('reviewConclusion', e.target.value)}
                placeholder="总结烘焙方案的优缺点，以及注意事项..."
              />
            </div>

            <div className="form-group">
              <label>模板备注</label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="补充说明，如适用场景、特殊要求等..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {template ? '保存修改' : '创建模板'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
