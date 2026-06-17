export const REVIEW_STATUS = {
  PENDING: '待杯测',
  TESTED: '已杯测',
  NEED_ADJUST: '需调整',
  REUSABLE: '可复用'
}

export const ROAST_LEVELS = ['浅烘', '中浅', '中烘', '中深', '深烘']

export const STORAGE_KEY = 'coffee_roasting_batches'

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function getBatches() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to load batches:', e)
    return []
  }
}

export function saveBatches(batches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batches))
    return true
  } catch (e) {
    console.error('Failed to save batches:', e)
    return false
  }
}

export function addBatch(batch) {
  const batches = getBatches()
  const newBatch = { ...batch, id: generateId(), createdAt: Date.now() }
  batches.unshift(newBatch)
  saveBatches(batches)
  return newBatch
}

export function updateBatch(id, updates) {
  const batches = getBatches()
  const index = batches.findIndex(b => b.id === id)
  if (index !== -1) {
    batches[index] = { ...batches[index], ...updates, updatedAt: Date.now() }
    saveBatches(batches)
    return batches[index]
  }
  return null
}

export function deleteBatch(id) {
  const batches = getBatches()
  const filtered = batches.filter(b => b.id !== id)
  saveBatches(filtered)
  return filtered
}

export function duplicateBatch(id) {
  const batches = getBatches()
  const original = batches.find(b => b.id === id)
  if (original) {
    const copy = {
      ...original,
      id: generateId(),
      roastDate: new Date().toISOString().split('T')[0],
      reviewStatus: REVIEW_STATUS.PENDING,
      reviewConclusion: '',
      defectNotes: '',
      flavorNotes: original.flavorNotes,
      createdAt: Date.now()
    }
    batches.unshift(copy)
    saveBatches(batches)
    return copy
  }
  return null
}

export function exportToJson(batches) {
  const dataStr = JSON.stringify(batches, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `coffee-batches-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function validateBatch(batch) {
  const warnings = []

  if (batch.dropTemp !== null && batch.dropTemp !== undefined && batch.dropTemp !== '' && (batch.dropTemp < 150 || batch.dropTemp > 250)) {
    warnings.push({ type: 'temp', message: '下豆温度异常，建议范围 150-250°C' })
  }

  if (!batch.yellowTime || !batch.firstCrackTime) {
    warnings.push({ type: 'missing', message: '关键时间点缺失（转黄时间或一爆时间）' })
  }

  if (batch.reviewStatus !== REVIEW_STATUS.PENDING && !batch.reviewConclusion) {
    warnings.push({ type: 'conclusion', message: '复盘结论未填写' })
  }

  return warnings
}

export function checkFrequentAdjustments(batches) {
  const beanGroups = {}
  batches.forEach(b => {
    if (b.beanType) {
      if (!beanGroups[b.beanType]) beanGroups[b.beanType] = []
      beanGroups[b.beanType].push(b)
    }
  })

  const issues = []
  Object.entries(beanGroups).forEach(([beanType, list]) => {
    const adjusted = list.filter(b => b.reviewStatus === REVIEW_STATUS.NEED_ADJUST)
    if (list.length >= 3 && adjusted.length >= list.length * 0.5) {
      issues.push({
        beanType,
        message: `豆种「${beanType}」共 ${list.length} 条记录，其中 ${adjusted.length} 条需调整，调整过于频繁`
      })
    }
  })

  return issues
}
