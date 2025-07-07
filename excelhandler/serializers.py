# excelhandler/serializers.py (Combined)

from rest_framework import serializers
from .models import (
    Student, Test, Question, StudentResponse, Institution, Batch,
    StudentTestPerformance, StudentSubjectPerformance
)

# --- Serializers for Slicer/Dropdowns (Keep these for value/label format) ---

class InstitutionSlicerSerializer(serializers.ModelSerializer):
    """
    Serializer for Institution model, specifically for slicer dropdowns (value/label).
    """
    value = serializers.IntegerField(source='id')
    label = serializers.CharField(source='name')

    class Meta:
        model = Institution
        fields = ['value', 'label']

class BatchSlicerSerializer(serializers.ModelSerializer):
    """
    Serializer for Batch model, specifically for slicer dropdowns (value/label).
    """
    value = serializers.IntegerField(source='id')
    label = serializers.CharField(source='name')

    class Meta:
        model = Batch
        fields = ['value', 'label']

class StudentClassSlicerSerializer(serializers.Serializer):
    """
    Serializer for distinct student class names for slicer dropdowns.
    """
    value = serializers.CharField(source='student_class')
    label = serializers.CharField(source='student_class')

class StudentSectionSlicerSerializer(serializers.Serializer):
    """
    Serializer for distinct student section names for slicer dropdowns.
    """
    value = serializers.CharField(source='section')
    label = serializers.CharField(source='section')

class TestTypeSlicerSerializer(serializers.Serializer):
    """
    Serializer for distinct test types for slicer dropdowns.
    """
    value = serializers.CharField(source='test_type')
    label = serializers.CharField(source='test_type')

class SubjectTagSlicerSerializer(serializers.Serializer):
    """
    Serializer for distinct subject tags for slicer dropdowns.
    """
    value = serializers.CharField(source='subject_tag')
    label = serializers.CharField(source='subject_tag')

# --- General Purpose Model Serializers (Add these for full model representation) ---

class InstitutionDetailSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Institution, exposing all fields.
    Use this when you need full institution data for metrics or display.
    """
    class Meta:
        model = Institution
        fields = '__all__'

class BatchDetailSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Batch, exposing all fields.
    Use this when you need full batch data for metrics or display.
    """
    class Meta:
        model = Batch
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Student.
    """
    class Meta:
        model = Student
        fields = '__all__'

class TestSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Test.
    """
    class Meta:
        model = Test
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Question.
    """
    class Meta:
        model = Question
        fields = '__all__'

class StudentResponseSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for StudentResponse.
    """
    class Meta:
        model = StudentResponse
        fields = '__all__'

class StudentTestPerformanceSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for StudentTestPerformance.
    """
    class Meta:
        model = StudentTestPerformance
        fields = '__all__'

class StudentSubjectPerformanceSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for StudentSubjectPerformance.
    """
    class Meta:
        model = StudentSubjectPerformance
        fields = '__all__'

# You would also define specific serializers for your dashboard metrics here,
# which would combine data from various models and calculations.
# Example (placeholder):
# class DashboardMetricsOutputSerializer(serializers.Serializer):
#     total_tests_conducted = serializers.IntegerField()
#     average_accuracy_percent = serializers.FloatField()
#     # ... other metrics