import React from 'react'

export default function AlertPanel({ alerts, onClose }) {
  function getAlertIcon(type) {
    switch (type) {
      case 'temp': return '🌡️'
      case 'missing': return '⚠️'
      case 'conclusion': return '📝'
      case 'frequent': return '🔄'
      default: return '⚠️'
    }
  }

  function getAlertClass(type) {
    switch (type) {
      case 'temp': return 'alert-temp'
      case 'missing': return 'alert-missing'
      case 'conclusion': return 'alert-conclusion'
      case 'frequent': return 'alert-frequent'
      default: return ''
    }
  }

  const grouped = alerts.reduce((acc, alert) => {
    const type = alert.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(alert)
    return acc
  }, {})

  const typeNames = {
    temp: '温度异常',
    missing: '数据缺失',
    conclusion: '复盘结论缺失',
    frequent: '调整频繁'
  }

  return (
    <div className="alert-panel">
      <div className="alert-panel-header">
        <h3>📊 数据检查结果</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      {alerts.length === 0 ? (
        <div className="alerts-empty">
          <span className="check-icon">✅</span>
          <p>所有数据检查通过，没有发现问题！</p>
        </div>
      ) : (
        <div className="alerts-list">
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type} className="alert-group">
              <h4 className={getAlertClass(type)}>
                {getAlertIcon(type)} {typeNames[type] || type} ({list.length})
              </h4>
              <ul>
                {list.map((alert, i) => (
                  <li key={i}>
                    <span className="alert-bean">
                      {alert.beanType || alert.beanType ? `「${alert.beanType}」` : ''}
                      {alert.roastDate ? ` ${alert.roastDate}` : ''}
                    </span>
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
