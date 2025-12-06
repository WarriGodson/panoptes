import { useEffect, useState } from 'react'

interface Cve {
  id: number
  cve_id: string
  summary: string
  severity: string
  cvss_score: number | null
  published_at: string
  type: string | null
  exploit_likelihood: string | null
  created_at: string
}

export default function Dashboard() {
  const [cves, setCves] = useState<Cve[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCves, setSelectedCves] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchCves()
  }, [])

  const fetchCves = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cves`)
      if (!response.ok) throw new Error('Failed to fetch CVEs')
      const data = await response.json()
      setCves(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CVEs')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectCve = (id: number) => {
    const newSelected = new Set(selectedCves)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCves(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedCves.size === paginatedCves.length) {
      setSelectedCves(new Set())
    } else {
      setSelectedCves(new Set(paginatedCves.map(cve => cve.id)))
    }
  }

  const exportToCsv = () => {
    const cvesToExport = selectedCves.size > 0 
      ? cves.filter(cve => selectedCves.has(cve.id))
      : cves

    if (cvesToExport.length === 0) {
      alert('No CVEs selected for export')
      return
    }

    const headers = ['CVE ID', 'Summary', 'Severity', 'CVSS Score', 'Published Date', 'Type', 'Exploit Likelihood']
    const rows = cvesToExport.map(cve => [
      cve.cve_id || '',
      (cve.summary || '').replace(/"/g, '""'),
      cve.severity || '',
      cve.cvss_score || 'N/A',
      cve.published_at || '',
      cve.type || 'N/A',
      cve.exploit_likelihood || 'N/A'
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panoptes-cves-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPdf = () => {
    const cvesToExport = selectedCves.size > 0 
      ? cves.filter(cve => selectedCves.has(cve.id))
      : cves

    if (cvesToExport.length === 0) {
      return
    }

    // Create PDF content using simple HTML structure
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Panoptes CVE Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
          .meta { color: #64748b; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f1f5f9; padding: 12px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold; }
          td { padding: 10px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .critical { background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .high { background-color: #fed7aa; color: #9a3412; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .medium { background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .low { background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Panoptes CVE Security Report</h1>
        <p class="meta">Generated on ${new Date().toLocaleString()} | Total CVEs: ${cvesToExport.length}</p>
        <table>
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>Summary</th>
              <th>Severity</th>
              <th>CVSS</th>
              <th>Type</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            ${cvesToExport.map(cve => `
              <tr>
                <td><strong>${cve.cve_id || 'N/A'}</strong></td>
                <td>${(cve.summary || 'No summary available').substring(0, 200)}${(cve.summary || '').length > 200 ? '...' : ''}</td>
                <td><span class="${(cve.severity || 'low').toLowerCase()}">${cve.severity || 'N/A'}</span></td>
                <td>${cve.cvss_score || 'N/A'}</td>
                <td>${cve.type || 'N/A'}</td>
                <td>${new Date(cve.published_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    // Open print dialog with the content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(pdfContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const paginatedCves = cves.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(cves.length / itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading CVEs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading CVEs</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Panoptes CVE Dashboard</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {cves.length} total CVEs • {selectedCves.size} selected
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToCsv}
                disabled={cves.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export {selectedCves.size > 0 ? `${selectedCves.size}` : 'All'} to CSV
              </button>
              <button
                onClick={exportToPdf}
                disabled={cves.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export to PDF
              </button>
            </div>
          </div>
        </div>

        {/* CVE List */}
        {cves.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 text-center border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg text-slate-600">No CVEs found yet</p>
            <p className="text-sm text-slate-500 mt-2">The bot will start collecting CVEs automatically</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCves.size === paginatedCves.length && paginatedCves.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">CVE ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Summary</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">CVSS</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Published</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedCves.map((cve) => (
                    <tr 
                      key={cve.id} 
                      className={`transition-all hover:bg-blue-50/50 ${selectedCves.has(cve.id) ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCves.has(cve.id)}
                          onChange={() => toggleSelectCve(cve.id)}
                          className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                          {cve.cve_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-md">
                        <div className="line-clamp-2">{cve.summary}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                          cve.severity === 'Critical' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                          cve.severity === 'High' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                          cve.severity === 'Medium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900' :
                          'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        }`}>
                          {cve.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900">{cve.cvss_score || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{cve.type || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(cve.published_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, cves.length)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{cves.length}</span> CVEs
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="px-2 py-2 text-slate-500">...</span>
                        }
                        return null
                      })}
                    </div>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
