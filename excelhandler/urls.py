from django.urls import path
from .views import upload_and_process_data,get_overall_performance,get_dashboard_metrics,get_neet_readiness,get_score_distribution,get_risk_breakdown,get_question_detail_analytics,get_question_analytics_matrix


urlpatterns = [
    path('load-all-data/', upload_and_process_data),
    path('overall-performance', get_overall_performance),
    path('cards', get_dashboard_metrics),
    path('neet-readiness', get_neet_readiness),
    path('score-distribution', get_score_distribution),
    path('risk', get_risk_breakdown),
    path('qnd', get_question_detail_analytics),
    path('qndm', get_question_analytics_matrix),
    
]
