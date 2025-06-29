from datetime import datetime

def _apply_filters_to_response_queryset(queryset, request):
    institution_name = request.GET.get('institution')
    batch_name = request.GET.get('batch')
    exam_type = request.GET.get('exam_type')
    student_class = request.GET.get('student_class')
    test_code = request.GET.get('test_code')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    if institution_name and institution_name.lower() != 'all institutions':
        queryset = queryset.filter(test_code__institution__name=institution_name)
    if batch_name and batch_name.lower() != 'all batches':
        queryset = queryset.filter(test_code__batch__name=batch_name)
    if exam_type and exam_type.lower() != 'all exam types':
        queryset = queryset.filter(test_code__test_type=exam_type)
    if student_class and student_class.lower() != 'all classes':
        queryset = queryset.filter(sturecid__student_class=student_class)
    if test_code and test_code.lower() != 'all tests':
        queryset = queryset.filter(test_code__test_code=test_code)
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(test_code__test_date__range=(start_date, end_date))
        except ValueError:
            pass
    return queryset

def _apply_filters_to_performance_queryset(queryset, request):
    institution_name = request.GET.get('institution')
    batch_name = request.GET.get('batch')
    exam_type = request.GET.get('exam_type')
    student_class = request.GET.get('student_class')
    test_code = request.GET.get('test_code')
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    if institution_name and institution_name.lower() != 'all institutions':
        queryset = queryset.filter(test__institution__name=institution_name)
    if batch_name and batch_name.lower() != 'all batches':
        queryset = queryset.filter(test__batch__name=batch_name)
    if exam_type and exam_type.lower() != 'all exam types':
        queryset = queryset.filter(test__test_type=exam_type)
    if student_class and student_class.lower() != 'all classes':
        queryset = queryset.filter(student__student_class=student_class)
    if test_code and test_code.lower() != 'all tests':
        queryset = queryset.filter(test__test_code=test_code)
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(test__test_date__range=(start_date, end_date))
        except ValueError:
            pass
    return queryset
