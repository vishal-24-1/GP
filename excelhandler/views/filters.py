# filters.py (Corrected subject lookup path in all relevant functions)
from datetime import datetime
import logging
from django.db.models import Q, F

# Get an instance of a logger for this module
logger = logging.getLogger(__name__)

def _apply_filters_to_response_queryset(queryset, request):
    institution_name = request.GET.get('institution')
    batch_name = request.GET.get('batch')
    section_name = request.GET.get('section')
    test_type = request.GET.get('test_type')
    subject_tag = request.GET.get('subject')
    start_date_str = request.GET.get('from')
    end_date_str = request.GET.get('to')

    # Apply institution filter
    if institution_name and institution_name.lower() != 'all institutions':
        queryset = queryset.filter(test_code__institution__name=institution_name)

    # Apply batch filter
    if batch_name and batch_name.lower() != 'all batches':
        queryset = queryset.filter(test_code__batch__name=batch_name)

    # Apply section filter (for students within the response)
    if section_name and section_name.lower() != 'all sections':
        queryset = queryset.filter(sturecid__section=section_name)

    # Apply test type filter
    if test_type and test_type.lower() != 'all test types':
        queryset = queryset.filter(test_code__test_type=test_type)

    # Corrected: Use test_code__question__subject_tag for filtering and refine F() expression
    if subject_tag and subject_tag.lower() != 'all subjects':
        # Filter StudentResponse where the linked Question has the subject_tag
        # AND the StudentResponse's question_number matches the linked Question's question_number.
        queryset = queryset.filter(
            test_code__question__subject_tag=subject_tag,
            test_code__question__question_number=F('question_number') # This links to the specific question
        ).distinct()

    # Apply date range filter
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(test_code__test_date__range=(start_date, end_date))
        except ValueError:
            logger.warning(f"Invalid date format received in _apply_filters_to_response_queryset: start_date={start_date_str}, end_date={end_date_str}")
            pass

    return queryset


def _apply_filters_to_performance_queryset(queryset, request):
    institution_name = request.GET.get('institution')
    batch_name = request.GET.get('batch')
    student_class_name = request.GET.get('student_class')
    section_name = request.GET.get('section')
    test_type = request.GET.get('test_type')
    subject_tag = request.GET.get('subject')
    start_date_str = request.GET.get('from')
    end_date_str = request.GET.get('to')

    # Apply institution filter
    if institution_name and institution_name.lower() != 'all institutions':
        queryset = queryset.filter(test__institution__name=institution_name)

    # Apply batch filter
    if batch_name and batch_name.lower() != 'all batches':
        queryset = queryset.filter(test__batch__name=batch_name)

    # Apply student class filter (for students within the performance)
    if student_class_name and student_class_name.lower() != 'all classes':
        queryset = queryset.filter(student__student_class=student_class_name)

    # Apply section filter (for students within the performance)
    if section_name and section_name.lower() != 'all sections':
        queryset = queryset.filter(student__section=section_name)

    # Apply test type filter
    if test_type and test_type.lower() != 'all test types':
        queryset = queryset.filter(test__test_type=test_type)

    # Corrected: Subject filter now uses test__question__subject_tag
    if subject_tag and subject_tag.lower() != 'all subjects':
        queryset = queryset.filter(test__question__subject_tag=subject_tag).distinct()

    # Apply date range filter
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(test__test_date__range=(start_date, end_date))
        except ValueError:
            logger.warning(f"Invalid date format received in _apply_filters_to_performance_queryset: start_date={start_date_str}, end_date={end_date_str}")
            pass

    return queryset


# NEW FILTER HELPER: For filtering directly on the Test model
def _apply_filters_to_test_queryset(queryset, request):
    """Applies common filters from request.GET to a Test queryset."""
    institution_name = request.GET.get('institution')
    batch_name = request.GET.get('batch')
    test_type = request.GET.get('test_type')
    subject_tag = request.GET.get('subject')
    start_date_str = request.GET.get('from')
    end_date_str = request.GET.get('to')

    if institution_name and institution_name.lower() != 'all institutions':
        queryset = queryset.filter(institution__name=institution_name)
    if batch_name and batch_name.lower() != 'all batches':
        queryset = queryset.filter(batch__name=batch_name)
    if test_type and test_type.lower() != 'all test types':
        queryset = queryset.filter(test_type=test_type)

    # Corrected: Subject filter now uses question__subject_tag
    if subject_tag and subject_tag.lower() != 'all subjects':
        queryset = queryset.filter(question__subject_tag=subject_tag).distinct()


    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(test_date__range=(start_date, end_date))
        except ValueError:
            logger.warning(f"Invalid date format received in _apply_filters_to_test_queryset: start_date={start_date_str}, end_date={end_date_str}")
            pass
    return queryset