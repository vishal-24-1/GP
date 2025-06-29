from django.http import JsonResponse
from django.db.models import Count, Q, F, Value
from django.db.models.functions import Coalesce
from django.db.models.expressions import Subquery, OuterRef
from excelhandler.models import StudentResponse, Question
from datetime import datetime

def get_question_analytics_matrix(request):
    """
    Provides question-wise analytics (Total Count, Attempted, Correct, Incorrect, Accuracy)
    for a given test type, month, specific test, and subject.
    Filters: test_type, month, test_code, subject_tag
    """
    try:
        test_type = request.GET.get('test_type')
        month_str = request.GET.get('month') # e.g., "June 2025"
        test_code_filter = request.GET.get('test_code')
        subject_tag_filter = request.GET.get('subject_tag')

        queryset = StudentResponse.objects.select_related('test_code', 'sturecid')

        if test_type and test_type.lower() != 'all':
            queryset = queryset.filter(test_code__test_type=test_type)

        if month_str and month_str.lower() != 'all':
            try:
                date_obj = datetime.strptime(month_str, '%B %Y')
                queryset = queryset.filter(
                    test_code__test_date__month=date_obj.month,
                    test_code__test_date__year=date_obj.year
                )
            except ValueError:
                return JsonResponse({'error': 'Invalid month format. Expected "MonthName YYYY" (e.g., "June 2025").'}, status=400)

        if test_code_filter and test_code_filter.lower() != 'all':
            queryset = queryset.filter(test_code__test_code=test_code_filter)

        question_subject_tag_subquery = Subquery(
            Question.objects.filter(
                test_code=OuterRef('test_code_id'),
                question_number=OuterRef('question_number')
            ).values('subject_tag')[:1],
            output_field=F('question_subject_tag').output_field if hasattr(F('question_subject_tag'), 'output_field') else None
        )
        queryset = queryset.annotate(
            question_subject_tag=Coalesce(question_subject_tag_subquery, Value('Unknown Subject'))
        )

        if subject_tag_filter and subject_tag_filter.lower() != 'all':
            queryset = queryset.filter(question_subject_tag=subject_tag_filter)
        queryset = queryset.exclude(question_subject_tag='Unknown Subject')

        question_analytics = queryset.values('question_number', 'question_subject_tag').annotate(
            total_count=Count('id'),
            attempted=Count('id', filter=Q(selected_option__gt=0)),
            correct=Count('id', filter=Q(is_correct=True, selected_option__gt=0)),
            incorrect=Count('id', filter=Q(is_correct=False, selected_option__gt=0))
        ).order_by('question_subject_tag', 'question_number')

        results = []
        for entry in question_analytics:
            accuracy = (entry['correct'] / entry['attempted'] * 100) if entry['attempted'] > 0 else 0.0
            results.append({
                'question_number': entry['question_number'],
                'subject': entry['question_subject_tag'],
                'total_count': entry['total_count'],
                'attempted': entry['attempted'],
                'correct': entry['correct'],
                'incorrect': entry['incorrect'],
                'accuracy': round(accuracy, 1),
                'view_link_params': {
                    'test_code': test_code_filter,
                    'question_number': entry['question_number']
                }
            })
        return JsonResponse(results, safe=False)
    except Exception as e:
        print(f"Error in get_question_analytics_matrix: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def get_question_detail_analytics(request):
    """
    Provides detailed analytics for a single question from a specific test.
    Required Filters: test_code, question_number
    """
    try:
        test_code = request.GET.get('test_code')
        question_number = request.GET.get('question_number')
        if not test_code or not question_number:
            return JsonResponse({'error': 'Both test_code and question_number are required.'}, status=400)
        try:
            question_number = int(question_number)
        except ValueError:
            return JsonResponse({'error': 'Invalid question_number. Must be an integer.'}, status=400)
        try:
            question_obj = Question.objects.get(test_code__test_code=test_code, question_number=question_number)
        except Question.DoesNotExist:
            return JsonResponse({'error': 'Question not found for the given test code and question number.'}, status=404)
        responses = StudentResponse.objects.filter(
            test_code__test_code=test_code,
            question_number=question_number
        )
        total_attempts = responses.exclude(selected_option=0).count()
        total_responses_recorded = responses.count()
        option_counts_raw = responses.values('selected_option').annotate(count=Count('id')).order_by('selected_option')
        option_distribution = {'0': 0, '1': 0, '2': 0, '3': 0, '4': 0}
        for item in option_counts_raw:
            option_distribution[str(item['selected_option'])] = item['count']
        display_distribution = {
            'A': {'count': option_distribution['1'], 'percentage': 0.0},
            'B': {'count': option_distribution['2'], 'percentage': 0.0},
            'C': {'count': option_distribution['3'], 'percentage': 0.0},
            'D': {'count': option_distribution['4'], 'percentage': 0.0},
        }
        total_attempted_for_options = sum(v['count'] for v in display_distribution.values())
        if total_attempted_for_options > 0:
            for option_key in display_distribution:
                display_distribution[option_key]['percentage'] = round((display_distribution[option_key]['count'] / total_attempted_for_options) * 100, 1)
        correct_count = responses.filter(is_correct=True, selected_option__gt=0).count()
        percent_correct = (correct_count / total_attempts * 100) if total_attempts > 0 else 0.0
        incorrect_count = responses.filter(is_correct=False, selected_option__gt=0).count()
        percent_incorrect = (incorrect_count / total_attempts * 100) if total_attempts > 0 else 0.0
        most_common_incorrect_option = None
        incorrect_responses_attempted = responses.filter(is_correct=False, selected_option__gt=0)
        if incorrect_responses_attempted.exists():
            common_option_data = incorrect_responses_attempted.values('selected_option') \
                                .annotate(count=Count('id')) \
                                .order_by('-count') \
                                .first()
            if common_option_data:
                option_map = {'1': 'A', '2': 'B', '3': 'C', '4': 'D'}
                most_common_incorrect_option = option_map.get(str(common_option_data['selected_option']), None)
        response_data = {
            'question_number': question_obj.question_number,
            'subject': question_obj.subject_tag,
            'total_attempts': total_attempts,
            'total_responses_recorded': total_responses_recorded,
            'percent_correct': round(percent_correct, 1),
            'percent_incorrect': round(percent_incorrect, 1),
            'most_common_incorrect_option': most_common_incorrect_option,
            'option_wise_distribution': display_distribution,
            'correct_option': question_obj.correct_option
        }
        return JsonResponse(response_data)
    except Exception as e:
        print(f"Error in get_question_detail_analytics: {e}")
        return JsonResponse({'error': str(e)}, status=500)
