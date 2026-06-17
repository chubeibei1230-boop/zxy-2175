import React, { useState, useEffect, useMemo } from 'react'
import {
  getBatches, addBatch, updateBatch, deleteBatch,
  duplicateBatch, exportToJson, REVIEW_STATUS, ROAST_LEVELS,
  validateBatch, checkFrequentAdjustments, calculateTotalScore,
  getReviewSuggestion,
  getTemplates, addTemplate, updateTemplate, deleteTemplate,
  duplicateTemplate, markTemplateUsed, TEMPLATE_RECOMMEND_STATUS,
  createTemplateFromBatch, applyTemplateToBatch
} from './utils/storage'
import BatchList from './components/BatchList'
import BatchForm from './components/BatchForm'
import CompareView from './components/CompareView'
import FilterBar from './components/FilterBar'
import AlertPanel from './components/AlertPanel'
import TemplateList from './components/TemplateList'
import TemplateForm from './components/TemplateForm'

export default function App() {
  const [batches, setBatches] = useState([])
  const [templates, setTemplates] = useState([])
  const [filters, setFilters] = useState({
    beanType: '',
    dateFrom: '',
    dateTo: '',
    roastLevel: '',
    reviewStatus: '',
    scoreRange: '',
    reviewSuggestion: ''
  })
  const [selectedIds, setSelectedIds] = useState([])
  const [compareIds, setCompareIds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [toast, setToast] = useState(null)
  const [showTemplateList, setShowTemplateList] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateSourceBatch, setTemplateSourceBatch] = useState(null)
  const [isTemplateFromBatch, setIsTemplateFromBatch] = useState(false)

  useEffect(() => {
    setBatches(getBatches())
    setTemplates(getTemplates())
  }, [])

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (filters.beanType && !b.beanType?.includes(filters.beanType)) return false
      if (filters.dateFrom && b.roastDate < filters.dateFrom) return false
      if (filters.dateTo && b.roastDate > filters.dateTo) return false
      if (filters.roastLevel && b.roastLevel !== filters.roastLevel) return false
      if (filters.reviewStatus && b.reviewStatus !== filters.reviewStatus) return false
      
      if (filters.scoreRange) {
        const totalScore = calculateTotalScore(b.cupping)
        if (totalScore === null) return false
        let min, max
        if (filters.scoreRange === '90+') {
          min = 90; max = 100
        } else if (filters.scoreRange === 'below75') {
          min = 0; max = 74.99
        } else {
          [min, max] = filters.scoreRange.split('-').map(Number)
          max = max + 0.99
        }
        if (totalScore < min || totalScore > max) return false
      }
      
      if (filters.reviewSuggestion) {
        const suggestion = getReviewSuggestion(b)
        if (suggestion !== filters.reviewSuggestion) return false
      }
      
      return true
    })
  }, [batches, filters])

  const beanTypes = useMemo(() => {
    const set = new Set(batches.map(b => b.beanType).filter(Boolean))
    return Array.from(set)
  }, [batches])

  const alerts = useMemo(() => {
    const list = []
    batches.forEach(b => {
      const warnings = validateBatch(b)
      warnings.forEach(w => {
        list.push({ batchId: b.id, beanType: b.beanType, roastDate: b.roastDate, ...w })
      })
    })
    const frequentIssues = checkFrequentAdjustments(batches)
    frequentIssues.forEach(f => {
      list.push({ type: 'frequent', message: f.message, beanType: f.beanType })
    })
    return list
  }, [batches])

  function handleAdd() {
    setEditingBatch(null)
    setShowForm(true)
  }

  function handleEdit(batch) {
    setEditingBatch(batch)
    setShowForm(true)
  }

  function handleDuplicate(id) {
    const copy = duplicateBatch(id)
    if (copy) {
      setBatches(getBatches())
    }
  }

  function handleDelete(id) {
    if (confirm('确定要删除这条批次记录吗？')) {
      deleteBatch(id)
      setBatches(getBatches())
      setSelectedIds(prev => prev.filter(sid => sid !== id))
      setCompareIds(prev => prev.filter(cid => cid !== id))
    }
  }

  function handleSave(batchData) {
    if (editingBatch) {
      updateBatch(editingBatch.id, batchData)
    } else {
      if (batchData.appliedTemplateId) {
        markTemplateUsed(batchData.appliedTemplateId)
        setTemplates(getTemplates())
      }
      addBatch(batchData)
    }
    setBatches(getBatches())
    setShowForm(false)
    setEditingBatch(null)
  }

  function handleSaveAsTemplate(batch) {
    const templateData = createTemplateFromBatch(batch)
    setTemplateSourceBatch(batch)
    setEditingTemplate(templateData)
    setIsTemplateFromBatch(true)
    setShowTemplateForm(true)
  }

  function handleOpenTemplateListFromForm() {
    setShowTemplateList(true)
  }

  function handleEditTemplate(template) {
    setEditingTemplate(template)
    setIsTemplateFromBatch(false)
    setTemplateSourceBatch(null)
    setShowTemplateList(false)
    setShowTemplateForm(true)
  }

  function handleDeleteTemplate(id) {
    if (confirm('确定要删除这个模板吗？')) {
      deleteTemplate(id)
      setTemplates(getTemplates())
      showToast('模板已删除')
    }
  }

  function handleDuplicateTemplate(id) {
    duplicateTemplate(id)
    setTemplates(getTemplates())
    showToast('模板已复制')
  }

  function handleUseTemplate(template) {
    const batchData = applyTemplateToBatch(template)
    markTemplateUsed(template.id)
    setTemplates(getTemplates())
    setEditingBatch(batchData)
    setShowTemplateList(false)
    setShowForm(true)
    showToast(`已应用模板「${template.name}」，请调整后保存`)
  }

  function handleToggleRecommendTemplate(id) {
    const template = templates.find(t => t.id === id)
    if (!template) return
    let nextStatus
    if (template.recommendStatus === TEMPLATE_RECOMMEND_STATUS.STARRED) {
      nextStatus = TEMPLATE_RECOMMEND_STATUS.NORMAL
    } else if (template.recommendStatus === TEMPLATE_RECOMMEND_STATUS.RECOMMENDED) {
      nextStatus = TEMPLATE_RECOMMEND_STATUS.STARRED
    } else {
      nextStatus = TEMPLATE_RECOMMEND_STATUS.RECOMMENDED
    }
    updateTemplate(id, { recommendStatus: nextStatus })
    setTemplates(getTemplates())
  }

  function handleSaveTemplate(templateData) {
    if (editingTemplate && editingTemplate.id) {
      updateTemplate(editingTemplate.id, templateData)
      showToast('模板已更新')
    } else {
      addTemplate(templateData)
      showToast('模板已创建')
    }
    setTemplates(getTemplates())
    setShowTemplateForm(false)
    setEditingTemplate(null)
    setIsTemplateFromBatch(false)
    setTemplateSourceBatch(null)
  }

  function handleBatchStatusChange(status) {
    selectedIds.forEach(id => {
      updateBatch(id, { reviewStatus: status })
    })
    setBatches(getBatches())
  }

  function handleSelectAll(checked) {
    if (checked) {
      setSelectedIds(filteredBatches.map(b => b.id))
    } else {
      setSelectedIds([])
    }
  }

  function handleSelect(id, checked) {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(sid => sid !== id))
    }
  }

  function handleCompareToggle(id) {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cid => cid !== id)
      } else if (prev.length < 3) {
        return [...prev, id]
      } else {
        showToast('最多只能对比 3 条记录')
        return prev
      }
    })
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  function handleExport() {
    exportToJson(batches)
  }

  function handleStartCompare() {
    if (compareIds.length >= 2 && compareIds.length <= 3) {
      setShowCompare(true)
    }
  }

  const compareBatches = compareIds.map(id => batches.find(b => b.id === id)).filter(Boolean)

  return (
    <div className="app">
      <header className="app-header">
        <h1>☕ 咖啡豆烘焙批次记录</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowTemplateList(true)}>
            📋 模板库 ({templates.length})
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAlerts(!showAlerts)}>
            数据检查 ({alerts.length})
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            导出 JSON
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            + 新增批次
          </button>
        </div>
      </header>

      {showAlerts && (
        <AlertPanel alerts={alerts} onClose={() => setShowAlerts(false)} />
      )}

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        beanTypes={beanTypes}
        roastLevels={ROAST_LEVELS}
        statusOptions={Object.values(REVIEW_STATUS)}
      />

      {selectedIds.length > 0 && (
        <div className="batch-actions-bar">
          <span>已选择 {selectedIds.length} 条</span>
          <button className="btn btn-sm" onClick={() => handleBatchStatusChange(REVIEW_STATUS.PENDING)}>
            设为待杯测
          </button>
          <button className="btn btn-sm" onClick={() => handleBatchStatusChange(REVIEW_STATUS.TESTED)}>
            设为已杯测
          </button>
          <button className="btn btn-sm" onClick={() => handleBatchStatusChange(REVIEW_STATUS.NEED_ADJUST)}>
            设为需调整
          </button>
          <button className="btn btn-sm" onClick={() => handleBatchStatusChange(REVIEW_STATUS.REUSABLE)}>
            设为可复用
          </button>
          <button className="btn btn-sm btn-cancel" onClick={() => setSelectedIds([])}>
            取消选择
          </button>
        </div>
      )}

      {compareIds.length > 0 && (
        <div className="compare-bar">
          <span>对比选择：{compareIds.length}/3 条</span>
          <button
            className="btn btn-sm btn-primary"
            disabled={compareIds.length < 2}
            onClick={handleStartCompare}
          >
            开始对比
          </button>
          <button className="btn btn-sm btn-cancel" onClick={() => setCompareIds([])}>
            清空对比
          </button>
        </div>
      )}

      <BatchList
        batches={filteredBatches}
        selectedIds={selectedIds}
        compareIds={compareIds}
        onSelectAll={handleSelectAll}
        onSelect={handleSelect}
        onCompareToggle={handleCompareToggle}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSaveAsTemplate={handleSaveAsTemplate}
      />

      {showForm && (
        <BatchForm
          batch={editingBatch}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingBatch(null)
          }}
          roastLevels={ROAST_LEVELS}
          statusOptions={Object.values(REVIEW_STATUS)}
          templates={templates}
          onOpenTemplateList={handleOpenTemplateListFromForm}
        />
      )}

      {showTemplateList && !showTemplateForm && (
        <TemplateList
          templates={templates}
          batches={batches}
          onClose={() => setShowTemplateList(false)}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          onDuplicate={handleDuplicateTemplate}
          onUse={handleUseTemplate}
          onToggleRecommend={handleToggleRecommendTemplate}
        />
      )}

      {showTemplateForm && (
        <TemplateForm
          template={editingTemplate}
          sourceBatch={templateSourceBatch}
          isFromBatch={isTemplateFromBatch}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowTemplateForm(false)
            setEditingTemplate(null)
            setIsTemplateFromBatch(false)
            setTemplateSourceBatch(null)
          }}
          roastLevels={ROAST_LEVELS}
        />
      )}

      {showCompare && (
        <CompareView
          batches={compareBatches}
          onClose={() => setShowCompare(false)}
        />
      )}

      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}
