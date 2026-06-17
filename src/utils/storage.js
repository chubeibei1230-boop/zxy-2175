export const REVIEW_STATUS = {
  PENDING: '待杯测',
  TESTED: '已杯测',
  NEED_ADJUST: '需调整',
  REUSABLE: '可复用'
}

export const ROAST_LEVELS = ['浅烘', '中浅', '中烘', '中深', '深烘']

export const CUPPING_FIELDS = [
  { key: 'aroma', label: '香气', max: 10 },
  { key: 'acidity', label: '酸质', max: 10 },
  { key: 'sweetness', label: '甜感', max: 10 },
  { key: 'body', label: '醇厚度', max: 10 },
  { key: 'aftertaste', label: '余韵', max: 10 },
  { key: 'balance', label: '均衡度', max: 10 }
]

export const CUPPING_GRADES = [
  { min: 90, grade: 'S', label: '卓越', color: '#6a1b9a' },
  { min: 85, grade: 'A', label: '优秀', color: '#2e7d32' },
  { min: 80, grade: 'B', label: '良好', color: '#1565c0' },
  { min: 75, grade: 'C', label: '一般', color: '#e65100' },
  { min: 0, grade: 'D', label: '较差', color: '#c62828' }
]

export const REVIEW_SUGGESTIONS = {
  REUSABLE: '可复用',
  ADJUST: '建议微调',
  RE_ROAST: '需要重烘'
}

export const SCORE_RANGES = [
  { value: '90+', label: '90分以上' },
  { value: '85-89', label: '85-89分' },
  { value: '80-84', label: '80-84分' },
  { value: '75-79', label: '75-79分' },
  { value: 'below75', label: '75分以下' }
]

export function calculateTotalScore(cupping) {
  if (!cupping) return null
  const scores = CUPPING_FIELDS.map(f => cupping[f.key])
  const validScores = scores.filter(s => s !== null && s !== undefined && s !== '')
  if (validScores.length !== CUPPING_FIELDS.length) return null
  const sum = validScores.reduce((acc, s) => acc + Number(s), 0)
  const defectDeduction = cupping.defectDeduction ? Number(cupping.defectDeduction) : 0
  const normalizedScore = (sum / (CUPPING_FIELDS.length * 10)) * 100 - defectDeduction * (100 / 60)
  return Number(Math.max(0, normalizedScore).toFixed(1))
}

export function getGrade(totalScore) {
  if (totalScore === null || totalScore === undefined) return null
  for (const g of CUPPING_GRADES) {
    if (totalScore >= g.min) {
      return g
    }
  }
  return CUPPING_GRADES[CUPPING_GRADES.length - 1]
}

export function getReviewSuggestion(batch) {
  const totalScore = calculateTotalScore(batch.cupping)
  if (totalScore === null) return null
  
  const defectDeduction = batch.cupping?.defectDeduction ? Number(batch.cupping.defectDeduction) : 0
  
  if (totalScore >= 88 && defectDeduction <= 1) {
    return REVIEW_SUGGESTIONS.REUSABLE
  } else if (totalScore >= 80 && defectDeduction <= 2) {
    return REVIEW_SUGGESTIONS.ADJUST
  } else {
    return REVIEW_SUGGESTIONS.RE_ROAST
  }
}

export function isCuppingComplete(cupping) {
  if (!cupping) return false
  const scores = CUPPING_FIELDS.map(f => cupping[f.key])
  return scores.every(s => s !== null && s !== undefined && s !== '')
}

export function hasAnyCuppingScore(cupping) {
  if (!cupping) return false
  const scores = CUPPING_FIELDS.map(f => cupping[f.key])
  return scores.some(s => s !== null && s !== undefined && s !== '')
}

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
    const emptyCupping = {}
    CUPPING_FIELDS.forEach(f => { emptyCupping[f.key] = '' })
    emptyCupping.defectDeduction = ''
    emptyCupping.overallNotes = ''
    
    const copy = {
      ...original,
      id: generateId(),
      roastDate: new Date().toISOString().split('T')[0],
      reviewStatus: REVIEW_STATUS.PENDING,
      reviewConclusion: '',
      defectNotes: '',
      flavorNotes: original.flavorNotes,
      cupping: emptyCupping,
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

  if (hasAnyCuppingScore(batch.cupping) && !isCuppingComplete(batch.cupping)) {
    warnings.push({ type: 'cupping_incomplete', message: '杯测评分不完整，部分维度未填写' })
  }

  const totalScore = calculateTotalScore(batch.cupping)
  if (totalScore !== null && totalScore < 75 && !batch.reviewConclusion) {
    warnings.push({ type: 'low_score_no_conclusion', message: '评分较低但未填写复盘结论' })
  }

  if (batch.reviewStatus === REVIEW_STATUS.TESTED && !hasAnyCuppingScore(batch.cupping)) {
    warnings.push({ type: 'tested_no_cupping', message: '状态为已杯测但未填写评分' })
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

export const TEMPLATES_STORAGE_KEY = 'coffee_roasting_templates'

export const TEMPLATE_RECOMMEND_STATUS = {
  NORMAL: '普通',
  RECOMMENDED: '推荐',
  STARRED: '精选'
}

export function getTemplates() {
  try {
    const data = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to load templates:', e)
    return []
  }
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    return true
  } catch (e) {
    console.error('Failed to save templates:', e)
    return false
  }
}

export function addTemplate(template) {
  const templates = getTemplates()
  const newTemplate = { ...template, id: generateId(), createdAt: Date.now(), lastUsedAt: null, useCount: 0 }
  templates.unshift(newTemplate)
  saveTemplates(templates)
  return newTemplate
}

export function updateTemplate(id, updates) {
  const templates = getTemplates()
  const index = templates.findIndex(t => t.id === id)
  if (index !== -1) {
    templates[index] = { ...templates[index], ...updates, updatedAt: Date.now() }
    saveTemplates(templates)
    return templates[index]
  }
  return null
}

export function deleteTemplate(id) {
  const templates = getTemplates()
  const filtered = templates.filter(t => t.id !== id)
  saveTemplates(filtered)
  return filtered
}

export function duplicateTemplate(id) {
  const templates = getTemplates()
  const original = templates.find(t => t.id === id)
  if (original) {
    const copy = {
      ...original,
      id: generateId(),
      name: original.name ? `${original.name} (副本)` : '未命名模板',
      recommendStatus: TEMPLATE_RECOMMEND_STATUS.NORMAL,
      lastUsedAt: null,
      useCount: 0,
      createdAt: Date.now()
    }
    templates.unshift(copy)
    saveTemplates(templates)
    return copy
  }
  return null
}

export function markTemplateUsed(id) {
  const templates = getTemplates()
  const index = templates.findIndex(t => t.id === id)
  if (index !== -1) {
    templates[index] = {
      ...templates[index],
      lastUsedAt: Date.now(),
      useCount: (templates[index].useCount || 0) + 1
    }
    saveTemplates(templates)
    return templates[index]
  }
  return null
}

export function createTemplateFromBatch(batch, options = {}) {
  const totalScore = calculateTotalScore(batch.cupping)
  return {
    name: options.name || `${batch.beanType || '未命名'} - ${batch.roastLevel || '烘焙方案'}`,
    beanType: batch.beanType || '',
    processMethod: batch.processMethod || '',
    roastLevel: batch.roastLevel || '',
    yellowTime: batch.yellowTime || '',
    firstCrackTime: batch.firstCrackTime || '',
    dropTemp: batch.dropTemp !== null && batch.dropTemp !== undefined ? batch.dropTemp : null,
    greenWeight: batch.greenWeight !== null && batch.greenWeight !== undefined ? batch.greenWeight : null,
    roastedWeight: batch.roastedWeight !== null && batch.roastedWeight !== undefined ? batch.roastedWeight : null,
    flavorTarget: batch.flavorNotes || '',
    cuppingSnapshot: batch.cupping ? { ...batch.cupping } : null,
    cuppingTotalScore: totalScore,
    reviewConclusion: batch.reviewConclusion || '',
    sourceBatchId: batch.id || null,
    sourceBatchDate: batch.roastDate || null,
    recommendStatus: TEMPLATE_RECOMMEND_STATUS.NORMAL,
    notes: options.notes || ''
  }
}

export function applyTemplateToBatch(template) {
  const emptyCupping = {}
  CUPPING_FIELDS.forEach(f => { emptyCupping[f.key] = '' })
  emptyCupping.defectDeduction = ''
  emptyCupping.overallNotes = ''

  return {
    beanType: template.beanType || '',
    processMethod: template.processMethod || '',
    roastDate: new Date().toISOString().split('T')[0],
    roastLevel: template.roastLevel || '',
    yellowTime: template.yellowTime || '',
    firstCrackTime: template.firstCrackTime || '',
    dropTemp: template.dropTemp !== null && template.dropTemp !== undefined ? template.dropTemp : '',
    greenWeight: template.greenWeight !== null && template.greenWeight !== undefined ? template.greenWeight : '',
    roastedWeight: template.roastedWeight !== null && template.roastedWeight !== undefined ? template.roastedWeight : '',
    flavorNotes: template.flavorTarget || '',
    defectNotes: '',
    reviewStatus: REVIEW_STATUS.PENDING,
    reviewConclusion: '',
    cupping: emptyCupping,
    appliedTemplateId: template.id,
    appliedTemplateName: template.name
  }
}

export function canSaveAsTemplate(batch) {
  const suggestion = getReviewSuggestion(batch)
  return suggestion === REVIEW_SUGGESTIONS.REUSABLE || suggestion === REVIEW_SUGGESTIONS.ADJUST
}

export function getInsightStats(batches) {
  const total = batches.length
  const testedBatches = batches.filter(b => b.reviewStatus === REVIEW_STATUS.TESTED || b.reviewStatus === REVIEW_STATUS.REUSABLE || b.reviewStatus === REVIEW_STATUS.NEED_ADJUST)
  const testedCount = testedBatches.length

  const scoredBatches = batches.filter(b => calculateTotalScore(b.cupping) !== null)
  let avgScore = null
  if (scoredBatches.length > 0) {
    const sum = scoredBatches.reduce((acc, b) => acc + calculateTotalScore(b.cupping), 0)
    avgScore = Number((sum / scoredBatches.length).toFixed(1))
  }

  const reusableCount = batches.filter(b => {
    const s = getReviewSuggestion(b)
    return s === REVIEW_SUGGESTIONS.REUSABLE
  }).length

  const adjustCount = batches.filter(b => {
    const s = getReviewSuggestion(b)
    return s === REVIEW_SUGGESTIONS.ADJUST
  }).length

  const reRoastCount = batches.filter(b => {
    const s = getReviewSuggestion(b)
    return s === REVIEW_SUGGESTIONS.RE_ROAST
  }).length

  const pendingCount = batches.filter(b => getReviewSuggestion(b) === null).length

  return {
    total,
    testedCount,
    avgScore,
    reusableCount,
    adjustCount,
    reRoastCount,
    pendingCount,
    scoredCount: scoredBatches.length
  }
}

export function getSuggestionDistribution(batches) {
  const reusable = []
  const adjust = []
  const reRoast = []
  const unscored = []

  batches.forEach(b => {
    const suggestion = getReviewSuggestion(b)
    if (suggestion === REVIEW_SUGGESTIONS.REUSABLE) {
      reusable.push(b)
    } else if (suggestion === REVIEW_SUGGESTIONS.ADJUST) {
      adjust.push(b)
    } else if (suggestion === REVIEW_SUGGESTIONS.RE_ROAST) {
      reRoast.push(b)
    } else {
      unscored.push(b)
    }
  })

  return { reusable, adjust, reRoast, unscored }
}

export function getCommonIssues(batches) {
  const issues = []

  const lowScoreBatches = batches.filter(b => {
    const score = calculateTotalScore(b.cupping)
    return score !== null && score < 80
  })
  if (lowScoreBatches.length > 0) {
    const avgScore = lowScoreBatches.reduce((acc, b) => acc + calculateTotalScore(b.cupping), 0) / lowScoreBatches.length
    issues.push({
      type: 'low_score',
      level: 'warning',
      title: '低分批次较多',
      message: `共有 ${lowScoreBatches.length} 个批次评分低于 80 分，平均分 ${avgScore.toFixed(1)}，建议重点分析烘焙曲线。`,
      batchIds: lowScoreBatches.map(b => b.id)
    })
  }

  const defectBatches = batches.filter(b => {
    const deduction = b.cupping?.defectDeduction ? Number(b.cupping.defectDeduction) : 0
    return deduction >= 2
  })
  if (defectBatches.length > 0) {
    issues.push({
      type: 'high_defect',
      level: 'error',
      title: '缺陷扣分偏高',
      message: `有 ${defectBatches.length} 个批次缺陷扣分 ≥ 2 分，可能存在烘焙不均匀或豆种本身问题。`,
      batchIds: defectBatches.map(b => b.id)
    })
  }

  const frequentIssues = checkFrequentAdjustments(batches)
  frequentIssues.forEach(f => {
    issues.push({
      type: 'frequent_adjust',
      level: 'warning',
      title: '调整过于频繁',
      message: f.message,
      beanType: f.beanType
    })
  })

  const missingTimeBatches = batches.filter(b => !b.yellowTime || !b.firstCrackTime)
  if (missingTimeBatches.length > 0) {
    issues.push({
      type: 'missing_data',
      level: 'info',
      title: '关键数据缺失',
      message: `有 ${missingTimeBatches.length} 个批次缺少转黄时间或一爆时间记录，建议完善数据以获得更准确的洞察。`,
      batchIds: missingTimeBatches.map(b => b.id)
    })
  }

  const pendingBatches = batches.filter(b => b.reviewStatus === REVIEW_STATUS.PENDING && calculateTotalScore(b.cupping) !== null)
  if (pendingBatches.length > 0) {
    issues.push({
      type: 'pending_review',
      level: 'info',
      title: '待复盘批次',
      message: `有 ${pendingBatches.length} 个批次已评分但状态仍为「待杯测」，建议更新复盘状态。`,
      batchIds: pendingBatches.map(b => b.id)
    })
  }

  return issues
}

export function getGroupedByBeanType(batches) {
  const groups = {}
  batches.forEach(b => {
    const key = b.beanType || '未命名豆种'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(b)
  })
  return Object.entries(groups).map(([beanType, list]) => {
    const scored = list.filter(b => calculateTotalScore(b.cupping) !== null)
    const avgScore = scored.length > 0
      ? Number((scored.reduce((acc, b) => acc + calculateTotalScore(b.cupping), 0) / scored.length).toFixed(1))
      : null
    const reusable = list.filter(b => getReviewSuggestion(b) === REVIEW_SUGGESTIONS.REUSABLE).length
    return { beanType, count: list.length, avgScore, reusable }
  }).sort((a, b) => b.count - a.count)
}

export function getGroupedByRoastLevel(batches) {
  const groups = {}
  ROAST_LEVELS.forEach(level => { groups[level] = [] })
  batches.forEach(b => {
    if (b.roastLevel && groups[b.roastLevel]) {
      groups[b.roastLevel].push(b)
    }
  })
  return Object.entries(groups).map(([roastLevel, list]) => {
    const scored = list.filter(b => calculateTotalScore(b.cupping) !== null)
    const avgScore = scored.length > 0
      ? Number((scored.reduce((acc, b) => acc + calculateTotalScore(b.cupping), 0) / scored.length).toFixed(1))
      : null
    const reusable = list.filter(b => getReviewSuggestion(b) === REVIEW_SUGGESTIONS.REUSABLE).length
    return { roastLevel, count: list.length, avgScore, reusable }
  })
}

export function getScoreDistribution(batches) {
  const dist = {}
  CUPPING_GRADES.forEach(g => { dist[g.grade] = { ...g, count: 0, batches: [] } })
  batches.forEach(b => {
    const score = calculateTotalScore(b.cupping)
    if (score !== null) {
      const grade = getGrade(score)
      if (grade) {
        dist[grade.grade].count++
        dist[grade.grade].batches.push(b)
      }
    }
  })
  return Object.values(dist)
}

export function findRecommendedTemplates(templates, batches) {
  const starred = templates.filter(t => t.recommendStatus === TEMPLATE_RECOMMEND_STATUS.STARRED)
  const recommended = templates.filter(t => t.recommendStatus === TEMPLATE_RECOMMEND_STATUS.RECOMMENDED)

  const topReusableBatches = batches
    .filter(b => getReviewSuggestion(b) === REVIEW_SUGGESTIONS.REUSABLE)
    .sort((a, b) => calculateTotalScore(b.cupping) - calculateTotalScore(a.cupping))
    .slice(0, 3)

  return {
    starred,
    recommended,
    topReusableBatches
  }
}
