'use client'

interface Props {
  selectedMonth: string
  options: { value: string; label: string }[]
}

export default function MonthSelector({ selectedMonth, options }: Props) {
  return (
    <select
      name="month"
      defaultValue={selectedMonth}
      onChange={(e) => {
        window.location.href = `?month=${e.target.value}`
      }}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
