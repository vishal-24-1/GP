from django.http import JsonResponse
from django.db.models.expressions import Window
from django.db.models.functions import DenseRank
from django.db.models import F
from excelhandler.models import StudentTestPerformance

def get_overall_performance(request):
    try:
        batch_name = request.GET.get('batch')
        student_class = request.GET.get('student_class')
        queryset = StudentTestPerformance.objects.select_related('student', 'test__batch')
        if batch_name:
            queryset = queryset.filter(test__batch__name=batch_name)
        if student_class and student_class.lower() != 'all':
            queryset = queryset.filter(student__student_class=student_class)
        ranked_queryset = queryset.annotate(
            dynamic_rank=Window(
                expression=DenseRank(),
                order_by=F('total_score').desc()
            )
        ).order_by('dynamic_rank', '-total_score')
        data = []
        for performance in ranked_queryset:
            data.append({
                'rank': performance.dynamic_rank,
                'name': performance.student.name,
                'class': performance.student.student_class,
                'overall_score': performance.total_score,
                'sturecid': performance.student.sturecid,
                'test_code': performance.test.test_code
            })
        return JsonResponse(data, safe=False)
    except Exception as e:
        print(f"Error in get_overall_performance: {e}")
        return JsonResponse({'error': str(e)}, status=500)
