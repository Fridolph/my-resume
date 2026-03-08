const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

export function useDateTimeFormatter() {
  function formatDateTime(value: string | number | Date | null | undefined, fallback = '暂无') {
    if (!value) {
      return fallback
    }

    return dateTimeFormatter.format(new Date(value))
  }

  return {
    formatDateTime
  }
}
