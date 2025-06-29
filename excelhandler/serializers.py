from rest_framework import serializers
from .models import Student, Test, Question, StudentResponse, Institution, Batch, StudentTestPerformance, StudentSubjectPerformance

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

class StudentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentResponse
        fields = '__all__'

class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

class StudentTestPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTestPerformance
        fields = '__all__'

class StudentSubjectPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubjectPerformance
        fields = '__all__'
