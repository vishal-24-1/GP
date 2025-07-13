import logging
import json

from django.http import JsonResponse
from django.db.models import Avg, Sum, F, Q, Count, FloatField, Value, Case, When,Window
from django.db.models.functions import Coalesce
from excelhandler.models import StudentResponse, StudentTestPerformance, Question,Test
from .filters import _apply_filters_to_response_queryset, _apply_filters_to_performance_queryset, _apply_filters_to_test_queryset
from django.db.models.expressions import Subquery, OuterRef
from django.contrib.postgres.aggregates import StringAgg 
from django.db.models.functions import DenseRank
# Get an instance of a logger
logger = logging.getLogger(__name__)
def get_dashboard_metrics(request):
    try:
        # --- Common QuerySets (Initial filtering) ---
        # Queryset for metrics that use StudentResponse
        base_response_queryset = StudentResponse.objects.select_related(
            'sturecid', 'test_code', 'test_code__institution', 'test_code__batch',
            'sturecid__student_class', 'sturecid__section'
        )
        filtered_response_queryset = _apply_filters_to_response_queryset(base_response_queryset, request)

        # Queryset for metrics that use StudentTestPerformance
        base_performance_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test', 'test__institution', 'test__batch',
            'student__student_class', 'student__section'
        )
        filtered_performance_queryset = _apply_filters_to_performance_queryset(base_performance_queryset, request)

        # --- 1. Total Tests Conducted ---
        # This counts distinct tests based on the filtered student responses
        total_tests_conducted = filtered_response_queryset.values('test_code').distinct().count()

        # --- 2. Average Accuracy % ---
        # Aggregate correct and attempted responses in a single query
        accuracy_stats = filtered_response_queryset.aggregate(
            total_correct=Count(
                Case(
                    When(is_correct=True, selected_option__gt=0, then=1),
                    output_field=FloatField()
                )
            ),
            total_attempted=Count(
                Case(
                    When(selected_option__gt=0, then=1), # Selected option not 0 means attempted
                    output_field=FloatField()
                )
            )
        )
        total_correct_responses = accuracy_stats['total_correct'] or 0
        total_attempted_responses = accuracy_stats['total_attempted'] or 0
        average_accuracy = (total_correct_responses / total_attempted_responses * 100) if total_attempted_responses > 0 else 0.0

        # --- 3. Average Total Score ---
        avg_total_score_result = filtered_performance_queryset.aggregate(avg_score=Coalesce(Avg('total_score'), 0.0, output_field=FloatField()))
        average_total_score = avg_total_score_result['avg_score']
        
        test_queryset_for_max_score = Test.objects.all()
        test_queryset_for_max_score = _apply_filters_to_test_queryset(test_queryset_for_max_score, request)

        max_possible_score_display = 0.0
        if test_queryset_for_max_score.exists():
            representative_test = test_queryset_for_max_score.first()
            question_count = Question.objects.filter(test_code=representative_test).count()
            max_possible_score_display = float(question_count * 4)

        if max_possible_score_display == 0.0:
            max_possible_score_display = 1.0
        # --- 4. Average Attempt Rate (%) ---
        # Aggregate attempted and total responses in a single query
        attempt_rate_stats = filtered_response_queryset.aggregate(
            total_attempted=Count(
                Case(
                    When(selected_option__gt=0, then=1),
                    output_field=FloatField()
                )
            ),
            total_responses=Count('id') # Count all records in the filtered queryset
        )
        total_attempted_questions = attempt_rate_stats['total_attempted'] or 0
        total_questions_delivered = attempt_rate_stats['total_responses'] or 0
        average_attempt_rate = (total_attempted_questions / total_questions_delivered * 100) if total_questions_delivered > 0 else 0.0

        # --- 5. Top 10% Avg Score & 6. Bottom 10% Avg Score ---
        # This requires ordering and slicing, which can be done efficiently in Django
        # by leveraging subqueries or just ordering and fetching.
        # For large datasets, window functions might be more performant if you were to
        # calculate rank directly in the database. For top/bottom N%, slicing is fine.

        total_performance_records = filtered_performance_queryset.count()
        top_10_avg_score = 0.0
        bottom_10_avg_score = 0.0

        if total_performance_records > 0:
            num_top_bottom_10 = max(1, int(total_performance_records * 0.10))

            # Get top 10%
            top_10_students_scores = filtered_performance_queryset.order_by('-total_score')[:num_top_bottom_10]
            top_10_avg_score_result = top_10_students_scores.aggregate(avg_score=Coalesce(Avg('total_score'), 0.0, output_field=FloatField()))
            top_10_avg_score = top_10_avg_score_result['avg_score']

            # Get bottom 10%
            bottom_10_students_scores = filtered_performance_queryset.order_by('total_score')[:num_top_bottom_10]
            bottom_10_avg_score_result = bottom_10_students_scores.aggregate(avg_score=Coalesce(Avg('total_score'), 0.0, output_field=FloatField()))
            bottom_10_avg_score = bottom_10_avg_score_result['avg_score']

        metrics_data = {
            'total_tests_conducted': total_tests_conducted,
            'average_accuracy_percent': round(average_accuracy, 1),
            'average_total_score': f"{round(average_total_score, 1)} / {int(max_possible_score_display)}", # Formatting as per image
            'average_attempt_rate_percent': round(average_attempt_rate, 1),
            'top_10_avg_score': f"{round(top_10_avg_score, 1)} / {int(max_possible_score_display)}", # Formatting as per image
            'bottom_10_avg_score': f"{round(bottom_10_avg_score, 1)} / {int(max_possible_score_display)}", # Formatting as per image
        }

        return JsonResponse(metrics_data)

    except Exception as e:
        logger.exception("Error in get_dashboard_metrics") # Use logger for exceptions
        return JsonResponse({'error': 'An internal server error occurred.'}, status=500) # Generic error message for client

def get_neet_readiness(request):
    """
    Calculates the percentage of students scoring above a specified threshold (e.g., 400 total score).
    Dynamically filters data based on all general dashboard criteria provided in the request.
    """
    try:
        # 1. Base QuerySet with necessary related fields for filtering and data access
        # 'student' is needed for student__student_class filtering (if applied by _apply_filters)
        # 'test' is needed if ordering by test_date is desired, or if test-specific details are needed later
        queryset = StudentTestPerformance.objects.select_related('student', 'test') 
        
        # 2. Apply all general filters to the queryset
        queryset = _apply_filters_to_performance_queryset(queryset, request)

        # 3. Optimize database queries: Use a single aggregate call to get all necessary counts
        stats = queryset.aggregate(
            total_records=Count('id'), # Count of all relevant performance records
            students_above_400=Count(    # Count of students scoring >= 400
                Case(
                    When(total_score__gte=400, then=1),
                    output_field=FloatField() # Ensure count is treated as a float for division
                )
            )
        )
        
        # 4. Extract results and handle potential None values (if no records found)
        total_performance_records = stats['total_records'] or 0
        students_scoring_above_400 = stats['students_above_400'] or 0

        # 5. Calculate percentage, handling division by zero
        percentage_above_400 = (students_scoring_above_400 / total_performance_records * 100) if total_performance_records > 0 else 0.0

        # 6. Return JSON response
        return JsonResponse({
            'percentage_students_above_400': round(percentage_above_400, 1)
        })

    except Exception as e:
        # Log the full traceback for debugging in production
        logger.exception("Error in get_neet_readiness: %s", e) 
        # Return a generic error message for security in production
        return JsonResponse({'error': 'An internal server error occurred while fetching NEET readiness data.'}, status=500)


def get_risk_breakdown(request):
    """
    Categorizes students into risk levels (Safe, Medium Risk, At Risk) based on their average percentage score
    across all relevant tests. Dynamically filters data based on general dashboard criteria.
    """
    try:
        # 1. Base QuerySet with necessary related fields
        base_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test__institution', 'test__batch'
        )
        
        # 2. Apply all general filters to the queryset
        filtered_performances = _apply_filters_to_performance_queryset(base_queryset, request)
        
        # 3. Subquery to dynamically get the number of questions for each test.
        # This is used to calculate the max_possible_score for individual performance records.
        num_questions_subquery = Subquery(
            Question.objects.filter(test_code=OuterRef('test_id')) # Link to the current test in the outer query
            .values('test_code') # Group by test_code to count questions per specific test
            .annotate(q_count=Count('id')) # Count questions for this test
            .values('q_count')[:1], # Select only the count, ensure it's a scalar value
            output_field=FloatField() # Explicitly cast subquery result to FloatField for arithmetic
        )

        # 4. Annotate each filtered performance record with its max possible score and percentage score
        performances_with_percentages = filtered_performances.annotate(
            max_possible_score=Coalesce(num_questions_subquery, 0.0) * 4.0 # Multiply by 4.0 (as per rule)
        ).annotate(
            percentage_score=Case(
                When(max_possible_score__gt=0, then=(F('total_score') * 100.0 / F('max_possible_score'))),
                default=Value(0.0, output_field=FloatField()), # Handle division by zero for percentage
                output_field=FloatField() # Ensure output type is float
            )
        )
        
        # 5. Aggregate performances by unique student to get their average percentage score across all filtered tests
        student_avg_performance = performances_with_percentages.values('student').annotate(
            avg_percentage_score=Avg('percentage_score') # Calculate the average percentage for each student
        )
        
        # 6. Optimize database queries: Use a single aggregate call for all risk category counts
        risk_stats = student_avg_performance.aggregate(
            total_unique_students=Count('student'), # Count distinct students after averaging
            count_safe=Count(Case(When(avg_percentage_score__gt=70, then=1), output_field=FloatField())),
            count_medium_risk=Count(Case(When(Q(avg_percentage_score__gte=40) & Q(avg_percentage_score__lt=70), then=1), output_field=FloatField())),
            count_at_risk=Count(Case(When(avg_percentage_score__lt=40, then=1), output_field=FloatField())),
        )

        # 7. Extract results, handling potential None values
        total_unique_students = risk_stats['total_unique_students'] or 0
        count_safe = risk_stats['count_safe'] or 0
        count_medium_risk = risk_stats['count_medium_risk'] or 0
        count_at_risk = risk_stats['count_at_risk'] or 0

        # 8. Calculate percentages, handling division by zero
        percent_safe = (count_safe / total_unique_students * 100) if total_unique_students > 0 else 0.0
        percent_medium_risk = (count_medium_risk / total_unique_students * 100) if total_unique_students > 0 else 0.0
        percent_at_risk = (count_at_risk / total_unique_students * 100) if total_unique_students > 0 else 0.0
        
        # 9. Return JSON response
        risk_breakdown_data = {
            'safe': {'count': int(count_safe), 'percentage': round(percent_safe, 1)},
            'medium_risk': {'count': int(count_medium_risk), 'percentage': round(percent_medium_risk, 1)},
            'at_risk': {'count': int(count_at_risk), 'percentage': round(percent_at_risk, 1)},
            'total_students_considered': int(total_unique_students),
        }
        return JsonResponse(risk_breakdown_data)

    except Exception as e:
        # Log the full traceback for debugging in production
        logger.exception("Error in get_risk_breakdown: %s", e)
        # Return a generic error message for security in production
        return JsonResponse({'error': 'An internal server error occurred while fetching risk breakdown.'}, status=500)
    
def get_trend_graph(request):
    """
    Returns a list of tests, each with its average score and a list of subjects covered,
    based on the applied filters.
    This function has been renamed from get_test_performance_summary to get_trend_graph.
    """
    try:
        queryset = StudentTestPerformance.objects.select_related(
            'test', 'test__institution', 'test__batch', 'student'
        )

        queryset = _apply_filters_to_performance_queryset(queryset, request)

        test_summary_data = queryset.values(
            'test__test_code',
            'test__test_date',
            'test__test_type',
            'test__institution__name',
            'test__batch__name'
        ).annotate(
            average_score=Avg('total_score'),
            # Corrected: Use test__question__subject_tag for StringAgg
            subjects_covered=StringAgg('test__question__subject_tag', delimiter=', ', distinct=True)
        ).order_by(
            'test__test_date', 'test__test_code'
        )

        results = []
        for entry in test_summary_data:
            results.append({
                'test_code': entry['test__test_code'],
                'test_date': entry['test__test_date'],
                'test_type': entry['test__test_type'],
                'institution': entry['test__institution__name'],
                'batch': entry['test__batch__name'],
                'average_score': round(entry['average_score'], 1) if entry['average_score'] is not None else 0.0,
                'subjects': entry['subjects_covered'] if entry['subjects_covered'] else "N/A"
            })

        return JsonResponse(results, safe=False)

    except Exception as e:
        logger.exception("Error in get_trend_graph: %s", e) # Log with new function name
        return JsonResponse({'error': 'An internal server error occurred while fetching trend graph data.'}, status=500)

def get_overall_performance(request):
    """
    Returns the top 10 individual student test performances based on applied filters.
    Includes dynamic calculation of maximum score for the tests in consideration.
    """
    try:
        # 1. Apply all common filters to StudentTestPerformance queryset
        # This will filter by Institution, Batch, Student Class, Section, Test Type, Subject, and Date Range.
        performance_queryset = StudentTestPerformance.objects.select_related(
            'student', 'test__institution', 'test__batch'
        )
        performance_queryset = _apply_filters_to_performance_queryset(performance_queryset, request)

        # 2. Determine the overall maximum score based on filtered tests
        # We need to apply the same filters to the Test model to get relevant tests
        test_queryset_for_max_score = Test.objects.all()
        # Use the specific filter helper for Test models
        test_queryset_for_max_score = _apply_filters_to_test_queryset(test_queryset_for_max_score, request)

        max_score_overall = 0
        if test_queryset_for_max_score.exists():
            # Get the first test from the filtered set to determine its question count
            # This assumes all tests within the filtered set have a consistent number of questions
            # for the purpose of a shared overall max score denominator.
            representative_test = test_queryset_for_max_score.first()

            # Count questions for this representative test
            question_count = Question.objects.filter(test_code=representative_test).count()
            max_score_overall = question_count * 4 # Assuming 4 marks per question
        
        if max_score_overall == 0:
            # Fallback if no relevant tests or questions are found
            # You might want a default max score or indicate N/A
            # For displaying "X / 720", a non-zero denominator is needed.
            # Let's set a default reasonable value if no questions are found, or return empty if no tests.
            if not performance_queryset.exists():
                return JsonResponse([], safe=False) # No data if no performances match
            else:
                max_score_overall = 1 # Prevent division by zero, though this scenario needs review


        # 3. Rank Individual Performances
        ranked_queryset = performance_queryset.annotate(
            dynamic_rank=Window(
                expression=DenseRank(),
                order_by=F('total_score').desc()
            )
        ).order_by('dynamic_rank', '-total_score') # Ensure consistent ordering for ties

        # 4. Limit to Top 10
        top_10_performances = ranked_queryset[:10] # Slicing works after order_by and annotate

        # 5. Format Output
        data = []
        for performance in top_10_performances:
            # Ensure student and test are loaded via select_related for efficiency
            data.append({
                'rank': performance.dynamic_rank,
                'name': performance.student.name,
                'section': performance.student.section, # Use the section field from Student model
                'overall_score': f"{performance.total_score} / {max_score_overall}", # Format the score
                'sturecid': performance.student.sturecid,
                'test_code': performance.test.test_code
            })

        return JsonResponse(data, safe=False)

    except Exception as e:
        logger.exception("Error in get_overall_performance: %s", e)
        return JsonResponse({'error': 'An internal server error occurred while fetching overall performance.'}, status=500)

def get_dashboard_all_metrics(request):
    """
    Returns all dashboard metrics, NEET readiness, risk breakdown, trend graph, and overall performance
    in a single JSON response, using the same filters as the individual endpoints.
    """
    try:
        # 1. Dashboard metrics
        metrics_response = get_dashboard_metrics(request)
        metrics_data = json.loads(metrics_response.content)
        # 2. NEET readiness
        neet_response = get_neet_readiness(request)
        neet_data = json.loads(neet_response.content)
        # 3. Risk breakdown
        risk_response = get_risk_breakdown(request)
        risk_data = json.loads(risk_response.content)
        # 4. Trend graph
        trend_response = get_trend_graph(request)
        trend_data = json.loads(trend_response.content)
        
        # 5. Overall performance
        overall_response = get_overall_performance(request)
        overall_data = json.loads(overall_response.content)
        # Combine all results
        return JsonResponse({
            'metrics': metrics_data,
            'neet_readiness': neet_data,
            'risk_breakdown': risk_data,
            'trend_graph': trend_data,
            'overall_performance': overall_data
        })
    except Exception as e:
        logger.exception("Error in get_dashboard_all_metrics")
        return JsonResponse({'error': 'An internal server error occurred.'}, status=500)
