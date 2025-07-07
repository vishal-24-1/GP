import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
# from rest_framework.permissions import IsAuthenticated # Uncomment and add to views for authentication

from django.db.models import Min, Max, CharField,Value
from django.db.models.functions import Coalesce
from django.db.models.expressions import Subquery, OuterRef

# Import all necessary models from your models.py
from excelhandler.models import (
    StudentResponse, Question, Test, Batch, Student, Institution
)

# --- UPDATED IMPORT FOR SERIALIZERS ---
from excelhandler.serializers import (
    InstitutionSlicerSerializer,      # Changed from InstitutionSerializer
    BatchSlicerSerializer,            # Changed from BatchSerializer
    StudentClassSlicerSerializer,
    StudentSectionSlicerSerializer,
    TestTypeSlicerSerializer,
    SubjectTagSlicerSerializer
)

logger = logging.getLogger(__name__)

# --- Constants for Filter Values ---
ALL_FILTER_VALUE = 'all'
UNKNOWN_SUBJECT_TAG = 'Unknown Subject'

# --- Helper Function for Filter Application (Centralized Logic) ---
def _apply_filters_to_queryset(queryset, request_data, base_model_name):
    """
    Applies comprehensive filters based on request_data to a given queryset.
    The base_model_name helps determine the correct foreign key path for filtering.
    This helper ensures that filter options are dynamically narrowed down
    based on other selected filters.
    """
    
    # Mapping for field paths based on the base queryset model
    # This ensures correct foreign key traversals for filtering.
    paths = {
        'StudentResponse': {
            'institution_id': 'test_code__institution__id',
            'batch_id': 'test_code__batch__id',
            'student_class': 'sturecid__student_class', # Field in Student model
            'section': 'sturecid__section',             # Field in Student model
            'test_type': 'test_code__test_type',
            'test_date': 'test_code__test_date',
            'test_code': 'test_code__test_code',
            'subject_tag': 'question_subject_tag', # This will be annotated if not present, then filtered
            'sturecid': 'sturecid__sturecid',
        },
        'Test': {
            'institution_id': 'institution__id',
            'batch_id': 'batch__id',
            'test_type': 'test_type',
            'test_date': 'test_date',
            'test_code': 'test_code',
        },
        'Student': {
            'institution_id': 'studentresponse__test_code__institution__id', # Student->StudentResponse->Test->Institution
            'batch_id': 'studentresponse__test_code__batch__id',         # Student->StudentResponse->Test->Batch
            'student_class': 'student_class',
            'section': 'section',
            'sturecid': 'sturecid',
        },
        'Question': {
            'test_code': 'test_code__test_code',
            'subject_tag': 'subject_tag',
            'test_type': 'test_code__test_type',
            'test_date': 'test_code__test_date',
            'institution_id': 'test_code__institution__id',
            'batch_id': 'test_code__batch__id',
        },
        'Batch': {
            'institution_id': 'institution__id', # Batch->Institution (direct FK)
            'batch_id': 'id', # Batch model PK
        },
        'Institution': {
            'institution_id': 'id', # Institution model PK
        }
    }
    
    current_paths = paths.get(base_model_name, {})

    # Institution Filter
    if request_data.get('institution_id') and request_data['institution_id'].lower() != ALL_FILTER_VALUE:
        try:
            inst_id = int(request_data['institution_id'])
            if 'institution_id' in current_paths:
                queryset = queryset.filter(**{current_paths['institution_id']: inst_id})
        except ValueError:
            raise ValueError("Invalid institution ID. Must be an integer.")

    # Batch Filter
    if request_data.get('batch_id') and request_data['batch_id'].lower() != ALL_FILTER_VALUE:
        try:
            batch_id = int(request_data['batch_id'])
            if 'batch_id' in current_paths:
                queryset = queryset.filter(**{current_paths['batch_id']: batch_id})
        except ValueError:
            raise ValueError("Invalid batch ID. Must be an integer.")

    # Class Filter (student_class)
    # This filter applies to students, but can affect tests/questions taken by those students.
    if request_data.get('class_name') and request_data['class_name'].lower() != ALL_FILTER_VALUE:
        if 'student_class' in current_paths:
            queryset = queryset.filter(**{current_paths['student_class']: request_data['class_name']})
        elif base_model_name in ['Test', 'StudentResponse', 'Question']:
            # Filter these models by tests taken by students of this class
            student_sturecids_in_class = Student.objects.filter(student_class=request_data['class_name']).values('sturecid')
            if base_model_name == 'Test':
                queryset = queryset.filter(studentresponse__sturecid__in=Subquery(student_sturecids_in_class)).distinct()
            elif base_model_name == 'StudentResponse':
                queryset = queryset.filter(sturecid__in=Subquery(student_sturecids_in_class))
            elif base_model_name == 'Question':
                queryset = queryset.filter(test_code__studentresponse__sturecid__in=Subquery(student_sturecids_in_class)).distinct()

    # Section Filter
    # Similar to class filter, applies to students first.
    if request_data.get('section_name') and request_data['section_name'].lower() != ALL_FILTER_VALUE:
        if 'section' in current_paths:
            queryset = queryset.filter(**{current_paths['section']: request_data['section_name']})
        elif base_model_name in ['Test', 'StudentResponse', 'Question']:
            # Filter these models by tests taken by students of this section
            student_sturecids_in_section = Student.objects.filter(section=request_data['section_name']).values('sturecid')
            if base_model_name == 'Test':
                queryset = queryset.filter(studentresponse__sturecid__in=Subquery(student_sturecids_in_section)).distinct()
            elif base_model_name == 'StudentResponse':
                queryset = queryset.filter(sturecid__in=Subquery(student_sturecids_in_section))
            elif base_model_name == 'Question':
                queryset = queryset.filter(test_code__studentresponse__sturecid__in=Subquery(student_sturecids_in_section)).distinct()

    # Test Type Filter
    if request_data.get('test_type') and request_data['test_type'].lower() != ALL_FILTER_VALUE:
        if 'test_type' in current_paths:
            queryset = queryset.filter(**{current_paths['test_type']: request_data['test_type']})

    # Test Name Filter (test_code) - Kept in helper for potential future use or internal filtering logic
    # though not exposed as a top-level slicer for now as per image.
    if request_data.get('test_name') and request_data['test_name'].lower() != ALL_FILTER_VALUE:
        if 'test_code' in current_paths:
            queryset = queryset.filter(**{current_paths['test_code']: request_data['test_name']})

    # Date Range Filter
    start_date_str = request_data.get('start_date')
    end_date_str = request_data.get('end_date')
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            if 'test_date' in current_paths:
                queryset = queryset.filter(**{f'{current_paths["test_date"]}__range': (start_date, end_date)})
        except ValueError:
            raise ValueError("Invalid date format. Expected %Y-%m-%d.")

    # Subject Filter
    # Special handling for StudentResponse to annotate subject_tag if not already done
    if base_model_name == 'StudentResponse':
        # This annotation is crucial for filtering StudentResponse by subject_tag
        # and for subsequent aggregations that need subject_tag.
        question_subject_tag_subquery = Subquery(
            Question.objects.filter(
                test_code=OuterRef('test_code'), 
                question_number=OuterRef('question_number')
            ).values('subject_tag')[:1],
            output_field=CharField()
        )
        queryset = queryset.annotate(
            question_subject_tag=Coalesce(question_subject_tag_subquery, Value(UNKNOWN_SUBJECT_TAG))
        )
        # Exclude responses where subject tag couldn't be determined before filtering by subject
        queryset = queryset.exclude(question_subject_tag=UNKNOWN_SUBJECT_TAG)

    if request_data.get('subject_name') and request_data['subject_name'].lower() != ALL_FILTER_VALUE:
        if 'subject_tag' in current_paths:
            queryset = queryset.filter(**{current_paths['subject_tag']: request_data['subject_name']})
        
    return queryset

# --- Filter Endpoints (DRF APIViews) ---

class InstitutionListView(APIView):
    """
    API endpoint to get a list of institutions for filtering.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            institutions = Institution.objects.values('id', 'name').distinct().order_by('name')
            # --- UPDATED SERIALIZER USAGE ---
            serializer = InstitutionSlicerSerializer(institutions, many=True) 
            return Response(serializer.data)
        except Exception as e:
            logger.exception(f"Error fetching institutions: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BatchListView(APIView):
    """
    API endpoint to get a list of batches for filtering, optionally filtered by institution.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            request_data = request.GET.dict()
            queryset = Batch.objects.all()
            
            # Apply institution filter
            queryset = _apply_filters_to_queryset(queryset, request_data, 'Batch')

            batches = queryset.values('id', 'name').distinct().order_by('name')
            # --- UPDATED SERIALIZER USAGE ---
            serializer = BatchSlicerSerializer(batches, many=True)
            return Response(serializer.data)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching batches: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ClassListView(APIView):
    """
    API endpoint to get a list of classes for filtering, optionally filtered by institution and batch.
    Although 'Class' isn't explicitly shown in the provided image as a direct slicer,
    it's common and was in your previous code. Keeping it for comprehensive filter options.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            request_data = request.GET.dict()
            queryset = Student.objects.all()

            # Build a subquery for sturecids that match the institution/batch filters
            student_id_subquery = StudentResponse.objects.values('sturecid').distinct()
            
            if request_data.get('institution_id') and request_data['institution_id'].lower() != ALL_FILTER_VALUE:
                student_id_subquery = student_id_subquery.filter(test_code__institution__id=int(request_data['institution_id']))
            if request_data.get('batch_id') and request_data['batch_id'].lower() != ALL_FILTER_VALUE:
                student_id_subquery = student_id_subquery.filter(test_code__batch__id=int(request_data['batch_id']))

            classes = queryset.filter(sturecid__in=Subquery(student_id_subquery)) \
                                 .values('student_class').distinct().order_by('student_class')
            
            # Filter out potential empty strings/None and serialize
            filtered_classes = [cls for cls in classes if cls['student_class']]
            # --- UPDATED SERIALIZER USAGE ---
            serializer = StudentClassSlicerSerializer(filtered_classes, many=True)
            return Response(serializer.data)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching classes: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SectionListView(APIView):
    """
    API endpoint to get a list of sections for filtering, optionally filtered by institution, batch, and class.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            request_data = request.GET.dict()
            queryset = Student.objects.all()

            # Build a subquery for sturecids that match the institution/batch/class filters
            student_id_subquery = StudentResponse.objects.values('sturecid').distinct()
            
            if request_data.get('institution_id') and request_data['institution_id'].lower() != ALL_FILTER_VALUE:
                student_id_subquery = student_id_subquery.filter(test_code__institution__id=int(request_data['institution_id']))
            if request_data.get('batch_id') and request_data['batch_id'].lower() != ALL_FILTER_VALUE:
                student_id_subquery = student_id_subquery.filter(test_code__batch__id=int(request_data['batch_id']))
            if request_data.get('class_name') and request_data['class_name'].lower() != ALL_FILTER_VALUE:
                student_id_subquery = student_id_subquery.filter(sturecid__student_class=request_data['class_name'])

            sections = queryset.filter(sturecid__in=Subquery(student_id_subquery)) \
                               .values('section').distinct().order_by('section')
            
            # Filter out potential empty strings/None and serialize
            filtered_sections = [sec for sec in sections if sec['section']]
            # --- UPDATED SERIALIZER USAGE ---
            serializer = StudentSectionSlicerSerializer(filtered_sections, many=True)
            return Response(serializer.data)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching sections: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TestTypeListView(APIView):
    """
    API endpoint to get a list of test types for filtering, applying all relevant filters.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            request_data = request.GET.dict()
            queryset = Test.objects.all()

            # Apply all filters
            queryset = _apply_filters_to_queryset(queryset, request_data, 'Test')

            test_types = queryset.values('test_type').distinct().order_by('test_type')
            # --- UPDATED SERIALIZER USAGE ---
            serializer = TestTypeSlicerSerializer(test_types, many=True)
            return Response(serializer.data)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching test types: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubjectListView(APIView):
    """
    API endpoint to get a list of subject tags for filtering, applying all relevant filters.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            request_data = request.GET.dict()
            queryset = Question.objects.all()
            
            # Apply all filters
            queryset = _apply_filters_to_queryset(queryset, request_data, 'Question')

            subjects = queryset.values('subject_tag').distinct().order_by('subject_tag')
            
            # Filter out potential empty strings/None and serialize
            filtered_subjects = [sub for sub in subjects if sub['subject_tag']]
            # --- UPDATED SERIALIZER USAGE ---
            serializer = SubjectTagSlicerSerializer(filtered_subjects, many=True)
            return Response(serializer.data)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching subjects: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DateRangeView(APIView):
    """
    API endpoint to get the minimum and maximum test dates available based on current filters.
    """
    # permission_classes = [IsAuthenticated] # Example: Add authentication
    def get(self, request, *args, **kwargs):
        try:
            request_data = request.GET.dict()
            queryset = Test.objects.all()

            # Apply all filters
            queryset = _apply_filters_to_queryset(queryset, request_data, 'Test')

            min_max_dates = queryset.aggregate(min_date=Min('test_date'), max_date=Max('test_date'))
            min_date = min_max_dates['min_date']
            max_date = min_max_dates['max_date']

            response_data = {
                'min_date': min_date.isoformat() if min_date else None,
                'max_date': max_date.isoformat() if max_date else None,
            }
            return Response(response_data)
        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching date range: {e}")
            return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
