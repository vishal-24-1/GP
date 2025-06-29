from django.contrib import admin
from .models import Student, Test, Question, StudentResponse, Institution,Batch,StudentTestPerformance,StudentSubjectPerformance

# -----------------------
# ADMIN: Institution
# -----------------------
@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    
    
# -----------------------
# ADMIN: Batch
# -----------------------
@admin.register(Batch)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name','institution')

# -----------------------
# ADMIN: Student
# -----------------------
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('sturecid', 'name', 'student_class', 'section', 'claid')
    search_fields = ('name', 'sturecid', 'claid')
    list_filter = ('student_class', 'section')


# -----------------------
# ADMIN: Test
# -----------------------
@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('test_code', 'test_type', 'test_date')
    search_fields = ('test_code',)
    list_filter = ('test_type', 'test_date')


# -----------------------
# ADMIN: Question
# -----------------------
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('test_code', 'question_number', 'correct_option', 'subject_tag')
    search_fields = ('test_code__test_code',)
    list_filter = ('subject_tag', 'test_code')


# -----------------------
# ADMIN: StudentResponse
# -----------------------
@admin.register(StudentResponse)
class StudentResponseAdmin(admin.ModelAdmin):
    list_display = (
        'sturecid',
        'test_code',
        'question_number',
        'selected_option',
        'is_correct',
        'score_awarded'
    )
    search_fields = ('sturecid__sturecid', 'test_code__test_code')
    list_filter = ('is_correct', 'score_awarded', 'test_code')


# -----------------------
# ADMIN: StudentTestPerformance
# -----------------------
@admin.register(StudentTestPerformance)
class StudentTestPerformanceAdmin(admin.ModelAdmin):
    list_display = ('student','test','total_score','rank')
    
# -----------------------
# ADMIN: StudentSubjectPerformance
# -----------------------
@admin.register(StudentSubjectPerformance)
class StudentSubjectPerformanceAdmin(admin.ModelAdmin):
    list_display = ('student','test','subject_tag','subject_score','subject_rank')
    

