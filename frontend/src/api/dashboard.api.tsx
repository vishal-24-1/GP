// Real API requests for Dashboard endpoints
export async function fetchDashboardAllMetrics(filters?: Record<string, any>) {
  const response = await fetch('/excelhandler/dashboard-all-metrics', {
    method: filters ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  return response.json();
}

export async function fetchDashboardCards(filters?: Record<string, any>) {
  const response = await fetch('/excelhandler/cards', {
    method: filters ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  return response.json();
}

export async function fetchOverallPerformance(filters?: Record<string, any>) {
  const response = await fetch('/excelhandler/overall-performance', {
    method: filters ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  return response.json();
}

export async function fetchNeetReadiness(filters?: Record<string, any>) {
  const response = await fetch('/excelhandler/neet-readiness', {
    method: filters ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  return response.json();
}

export async function fetchTrendGraph(filters?: Record<string, any>) {
  const response = await fetch('/excelhandler/trend-graph', {
    method: filters ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  return response.json();
}

export async function fetchRiskBreakdown(filters?: Record<string, any>) {
  const response = await fetch('/excelhandler/risk', {
    method: filters ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: filters ? JSON.stringify(filters) : undefined,
  });
  return response.json();
}
