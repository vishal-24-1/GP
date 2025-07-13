from django.urls import path
from .views import upload_and_process_data,get_overall_performance,get_dashboard_metrics,get_neet_readiness,get_trend_graph,get_risk_breakdown,get_question_detail_analytics,get_question_analytics_matrix,get_dashboard_all_metrics
from .views.slicers import InstitutionListView, BatchListView, ClassListView, SectionListView, TestTypeListView, SubjectListView, DateRangeView


urlpatterns = [
    path('load-all-data/',upload_and_process_data),
    path('overall-performance', get_overall_performance),
    path('dashboard-all-metrics', get_dashboard_all_metrics),
    path('cards', get_dashboard_metrics),
    path('neet-readiness', get_neet_readiness),
    path('trend-graph', get_trend_graph),
    path('risk', get_risk_breakdown),
    path('qnd', get_question_detail_analytics),
    path('qndm', get_question_analytics_matrix),
    path('filters/institutions/', InstitutionListView.as_view(), name='filter-institutions'),
    path('filters/batches/', BatchListView.as_view(), name='filter-batches'),
    path('filters/classes/', ClassListView.as_view(), name='filter-classes'),
    path('filters/sections/', SectionListView.as_view(), name='filter-sections'),
    path('filters/test-types/', TestTypeListView.as_view(), name='filter-test-types'),
    path('filters/subjects/', SubjectListView.as_view(), name='filter-subjects'),
    path('filters/date-range/', DateRangeView.as_view(), name='filter-date-range'),
]
