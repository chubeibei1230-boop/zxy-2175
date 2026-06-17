import React, { useState, useEffect } from 'react'

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
  reviewConclusion: ''
}

export default function BatchForm({ batch, onSave, onCancel, roastLevels, statusOptions }) {
  const [formData, setFormData] = useState(emptyBatch)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (batch) {
      setFormData({ ...emptyBatch, ...batch, dropTemp: batch.dropTemp?.toString() || '' })
    } else {
      setFormData(emptyBatch)
    }
  }, [batch])

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

    const data = {
      ...formData,
      dropTemp: formData.dropTemp ? Number(formData.dropTemp) : null,
      greenWeight: formData.greenWeight ? Number(formData.greenWeight) : null,
      roastedWeight: formData.roastedWeight ? Number(formData.roastedWeight) : null
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
            <h3>杯测与复盘</h3>
            <div className="form-group">
              <label>风味描述</label>
              <textarea
                rows={3}
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
            <div className="form-row">
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
