from django.http import JsonResponse
from django.db.models import Avg, Sum, F, Q, Count, FloatField, Value, Case, When
from django.db.models.functions import Coalesce
from excelhandler.models import StudentResponse, StudentTestPerformance, Question
from .filters import _apply_filters_to_response_queryset, _apply_filters_to_performance_queryset
from django.db.models.expressions import Subquery, OuterRef

def get_dashboard_metrics(request):
    try:
        total_tests_queryset = StudentResponse.objects.select_related(
            'sturecid', 'test_code', 'test_code__institution', 'test_code__batch'
        )
        total_tests_queryset = _apply_filters_to_response_queryset(total_tests_queryset, request)
        total_tests_conducted = total_tests_queryset.values('test_code').distinct().count()
        accuracy_queryset = StudentResponse.objects.select_related(
            'sturecid', 'test_code', 'test_code__institution', 'test_code__batch'
        )
        accuracy_queryset = _apply_filters_to_response_queryset(accuracy_queryset, request)
        total_correct_responses = accuracy_queryset.filter(is_correct=True, selected_option__gt=0).count()
        total_attempted_responses = accuracy_queryset.exclude(selected_option=0).count()
        average_accuracy = (total_correct_responses / total_attempted_responses * 100) if total_attempted_responses > 0 else 0.0
        total_score_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test', 'test__institution', 'test__batch'
        )
        total_score_queryset = _apply_filters_to_performance_queryset(total_score_queryset, request)
        avg_total_score_result = total_score_queryset.aggregate(avg_score=Avg('total_score'))
        average_total_score = avg_total_score_result['avg_score'] if avg_total_score_result['avg_score'] is not None else 0.0
        attempt_rate_queryset = StudentResponse.objects.select_related(
            'sturecid', 'test_code', 'test_code__institution', 'test_code__batch'
        )
        attempt_rate_queryset = _apply_filters_to_response_queryset(attempt_rate_queryset, request)
        total_attempted_questions = attempt_rate_queryset.exclude(selected_option=0).count()
        total_questions_delivered = attempt_rate_queryset.count()
        average_attempt_rate = (total_attempted_questions / total_questions_delivered * 100) if total_questions_delivered > 0 else 0.0
        top_10_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test', 'test__institution', 'test__batch'
        )
        top_10_queryset = _apply_filters_to_performance_queryset(top_10_queryset, request)
        total_performance_records = top_10_queryset.count()
        top_10_avg_score = 0.0
        if total_performance_records > 0:
            ordered_top_scores = top_10_queryset.order_by('-total_score')
            num_top_10 = max(1, int(total_performance_records * 0.10))
            top_10_students_scores = ordered_top_scores[:num_top_10]
            top_10_avg_score_result = top_10_students_scores.aggregate(avg_score=Avg('total_score'))
            top_10_avg_score = top_10_avg_score_result['avg_score'] if top_10_avg_score_result['avg_score'] is not None else 0.0
        bottom_10_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test', 'test__institution', 'test__batch'
        )
        bottom_10_queryset = _apply_filters_to_performance_queryset(bottom_10_queryset, request)
        total_performance_records_bottom = bottom_10_queryset.count()
        bottom_10_avg_score = 0.0
        if total_performance_records_bottom > 0:
            ordered_bottom_scores = bottom_10_queryset.order_by('total_score')
            num_bottom_10 = max(1, int(total_performance_records_bottom * 0.10))
            bottom_10_students_scores = ordered_bottom_scores[:num_bottom_10]
            bottom_10_avg_score_result = bottom_10_students_scores.aggregate(avg_score=Avg('total_score'))
            bottom_10_avg_score = bottom_10_avg_score_result['avg_score'] if bottom_10_avg_score_result['avg_score'] is not None else 0.0
        metrics_data = {
            'total_tests_conducted': total_tests_conducted,
            'average_accuracy_percent': round(average_accuracy, 1),
            'average_total_score': round(average_total_score, 1),
            'average_attempt_rate_percent': round(average_attempt_rate, 1),
            'top_10_avg_score': round(top_10_avg_score, 1),
            'bottom_10_avg_score': round(bottom_10_avg_score, 1),
        }
        return JsonResponse(metrics_data)
    except Exception as e:
        print(f"Error in get_dashboard_metrics: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def get_neet_readiness(request):
    try:
        student_class = request.GET.get('student_class')
        queryset = StudentTestPerformance.objects.select_related('student')
        if student_class and student_class.lower() != 'all classes':
            queryset = queryset.filter(student__student_class=student_class)
        total_performance_records = queryset.count()
        students_scoring_above_550 = queryset.filter(total_score__gte=400).count()
        percentage_above_550 = (students_scoring_above_550 / total_performance_records * 100) if total_performance_records > 0 else 0.0
        return JsonResponse({
            'percentage_students_above_550': round(percentage_above_550, 1)
        })
    except Exception as e:
        print(f"Error in get_neet_readiness: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def get_score_distribution(request):
    try:
        queryset = StudentTestPerformance.objects.select_related(
            'student', 'test__institution', 'test__batch'
        )
        queryset = _apply_filters_to_performance_queryset(queryset, request)
        total_records = queryset.count()
        count_gt_600 = queryset.filter(total_score__gt=600).count()
        count_gt_550 = queryset.filter(total_score__gt=550).count()
        count_gt_500 = queryset.filter(total_score__gt=500).count()
        count_gt_400 = queryset.filter(total_score__gt=400).count()
        count_gt_300 = queryset.filter(total_score__gt=300).count()
        percent_gt_600 = (count_gt_600 / total_records * 100) if total_records > 0 else 0.0
        percent_gt_550 = (count_gt_550 / total_records * 100) if total_records > 0 else 0.0
        percent_gt_500 = (count_gt_500 / total_records * 100) if total_records > 0 else 0.0
        percent_gt_400 = (count_gt_400 / total_records * 100) if total_records > 0 else 0.0
        percent_gt_300 = (count_gt_300 / total_records * 100) if total_records > 0 else 0.0
        distribution_data = {
            'score_gt_600': {'count': count_gt_600, 'percentage': round(percent_gt_600, 1)},
            'score_gt_550': {'count': count_gt_550, 'percentage': round(percent_gt_550, 1)},
            'score_gt_500': {'count': count_gt_500, 'percentage': round(percent_gt_500, 1)},
            'score_gt_400': {'count': count_gt_400, 'percentage': round(percent_gt_400, 1)},
            'score_gt_300': {'count': count_gt_300, 'percentage': round(percent_gt_300, 1)},
        }
        return JsonResponse(distribution_data)
    except Exception as e:
        print(f"Error in get_score_distribution: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def get_risk_breakdown(request):
    try:
        base_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test__institution', 'test__batch'
        )
        filtered_performances = _apply_filters_to_performance_queryset(base_queryset, request)
        num_questions_subquery = Subquery(
            Question.objects.filter(test_code=OuterRef('test_id'))
            .values('test_code')
            .annotate(q_count=Count('id'))
            .values('q_count')[:1]
        )
        performances_with_percentages = filtered_performances.annotate(
            max_possible_score=Coalesce(num_questions_subquery, 0) * 4
        ).annotate(
            percentage_score=Case(
                When(max_possible_score__gt=0, then=(F('total_score') * 100.0 / F('max_possible_score'))),
                default=Value(0.0),
                output_field=FloatField()
            )
        )
        student_avg_performance = performances_with_percentages.values('student').annotate(
            avg_percentage_score=Avg('percentage_score')
        )
        total_unique_students = student_avg_performance.count()
        count_safe = student_avg_performance.filter(avg_percentage_score__gt=70).count()
        count_medium_risk = student_avg_performance.filter(avg_percentage_score__gte=40, avg_percentage_score__lt=70).count()
        count_at_risk = student_avg_performance.filter(avg_percentage_score__lt=40).count()
        percent_safe = (count_safe / total_unique_students * 100) if total_unique_students > 0 else 0.0
        percent_medium_risk = (count_medium_risk / total_unique_students * 100) if total_unique_students > 0 else 0.0
        percent_at_risk = (count_at_risk / total_unique_students * 100) if total_unique_students > 0 else 0.0
        risk_breakdown_data = {
            'safe': {'count': count_safe, 'percentage': round(percent_safe, 1)},
            'medium_risk': {'count': count_medium_risk, 'percentage': round(percent_medium_risk, 1)},
            'at_risk': {'count': count_at_risk, 'percentage': round(percent_at_risk, 1)},
            'total_students_considered': total_unique_students,
        }
        return JsonResponse(risk_breakdown_data)
    except Exception as e:
        print(f"Error in get_risk_breakdown: {e}")
        return JsonResponse({'error': str(e)}, status=500)
