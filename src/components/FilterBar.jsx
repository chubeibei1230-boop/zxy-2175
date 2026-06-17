import React from 'react'

export default function FilterBar({ filters, onFilterChange, beanTypes, roastLevels, statusOptions }) {
  function handleChange(key, value) {
    onFilterChange({ ...filters, [key]: value })
  }

  function handleReset() {
    onFilterChange({
      beanType: '',
      dateFrom: '',
      dateTo: '',
      roastLevel: '',
      reviewStatus: ''
    })
  }

  return (
    <div className="filter-bar">
      <div className="filter-item">
        <label>豆种</label>
        <input
          type="text"
          placeholder="输入豆种名称"
          value={filters.beanType}
          onChange={e => handleChange('beanType', e.target.value)}
        />
      </div>
      <div className="filter-item">
        <label>烘焙日期起</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => handleChange('dateFrom', e.target.value)}
        />
      </div>
      <div className="filter-item">
        <label>烘焙日期止</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => handleChange('dateTo', e.target.value)}
        />
      </div>
      <div className="filter-item">
        <label>烘焙程度</label>
        <select
          value={filters.roastLevel}
          onChange={e => handleChange('roastLevel', e.target.value)}
        >
          <option value="">全部</option>
          {roastLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      <div className="filter-item">
        <label>复盘状态</label>
        <select
          value={filters.reviewStatus}
          onChange={e => handleChange('reviewStatus', e.target.value)}
        >
          <option value="">全部</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      <div className="filter-item">
        <button className="btn btn-reset" onClick={handleReset}>重置筛选</button>
      </div>
    </div>
  )
}
