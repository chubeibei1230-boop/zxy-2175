import React, { useState, useEffect, useMemo } from 'react'
import {
  getBatches, addBatch, updateBatch, deleteBatch,
  duplicateBatch, exportToJson, REVIEW_STATUS, ROAST_LEVELS,
  validateBatch, checkFrequentAdjustments
} from './utils/storage'
import BatchList from './components/BatchList'
import BatchForm from './components/BatchForm'
import CompareView from './components/CompareView'
import FilterBar from './components/FilterBar'
import AlertPanel from './components/AlertPanel'

export default function App() {
  const [batches, setBatches] = useState([])
  const [filters, setFilters] = useState({
    beanType: '',
    dateFrom: '',
    dateTo: '',
    roastLevel: '',
    reviewStatus: ''
  })
  const [selectedIds, setSelectedIds] = useState([])
  const [compareIds, setCompareIds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setBatches(getBatches())
  }, [])

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (filters.beanType && !b.beanType?.includes(filters.beanType)) return false
      if (filters.dateFrom && b.roastDate < filters.dateFrom) return false
      if (filters.dateTo && b.roastDate > filters.dateTo) return false
      if (filters.roastLevel && b.roastLevel !== filters.roastLevel) return false
      if (filters.reviewStatus && b.reviewStatus !== filters.reviewStatus) return false
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
      addBatch(batchData)
    }
    setBatches(getBatches())
    setShowForm(false)
    setEditingBatch(null)
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
