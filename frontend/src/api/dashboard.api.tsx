// Real API requests for Dashboard endpoints
const API_BASE_URL = 'http://98.80.153.89/api';

function buildQueryParams(filters?: Record<string, any>) {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, value);
  });
  return params.toString() ? `?${params.toString()}` : '';
}

export async function fetchDashboardAllMetrics(filters?: Record<string, any>) {
  const url = `${API_BASE_URL}/dashboard-all-metrics${buildQueryParams(filters)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function fetchDashboardCards(filters?: Record<string, any>) {
  const url = `${API_BASE_URL}/cards${buildQueryParams(filters)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function fetchOverallPerformance(filters?: Record<string, any>) {
  const url = `${API_BASE_URL}/overall-performance${buildQueryParams(filters)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function fetchNeetReadiness(filters?: Record<string, any>) {
  const url = `${API_BASE_URL}/neet-readiness${buildQueryParams(filters)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function fetchTrendGraph(filters?: Record<string, any>) {
  const url = `${API_BASE_URL}/trend-graph${buildQueryParams(filters)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export async function fetchRiskBreakdown(filters?: Record<string, any>) {
  const url = `${API_BASE_URL}/risk${buildQueryParams(filters)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
