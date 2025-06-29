from django.db import models

# -------------------------
# DIMENSION: INSTITUTION
# -------------------------
class Institution(models.Model):
    name = models.CharField(max_length=255, unique=True) 

    def __str__(self):
        return self.name

# -------------------------
# DIMENSION: BATCH
# -------------------------
class Batch(models.Model):
    name = models.CharField(max_length=255)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('name', 'institution'),)

    def __str__(self):
        return f"{self.name} ({self.institution.name})"

# -------------------------
# DIMENSION: STUDENTS
# -------------------------
class Student(models.Model):
    sturecid = models.BigIntegerField(primary_key=True)  # Natural PK
    name = models.CharField(max_length=255)
    student_class = models.CharField(max_length=50)
    section = models.CharField(max_length=50, blank=True, null=True)
    claid = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.sturecid})"


# -------------------------
# DIMENSION: TESTS
# -------------------------
class Test(models.Model):
    test_code = models.CharField(max_length=255, primary_key=True)  # Natural PK
    test_date = models.DateField(blank=True, null=True)
    test_type = models.CharField(max_length=50)  # E.g., 'WEEKLY', 'GRAND', etc.
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE) # Now non-nullable
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)           # Now non-nullable

    def __str__(self):
        return self.test_code


# -------------------------
# DIMENSION: QUESTIONS
# -------------------------
class Question(models.Model):
    test_code = models.ForeignKey(Test, on_delete=models.CASCADE, to_field='test_code')
    question_number = models.PositiveIntegerField()
    correct_option = models.PositiveIntegerField()  # 1–4 or 0 for N/A
    subject_tag = models.CharField(max_length=50, blank=True, null=True)  # Optional tag

    class Meta:
        unique_together = (('test_code', 'question_number'),)

    def __str__(self):
        return f"Q{self.question_number} ({self.test_code})"


# -------------------------
# FACT: STUDENT RESPONSES
# -------------------------
class StudentResponse(models.Model):
    sturecid = models.ForeignKey(Student, on_delete=models.CASCADE, to_field='sturecid')
    test_code = models.ForeignKey(Test, on_delete=models.CASCADE, to_field='test_code')
    question_number = models.PositiveIntegerField()
    
    selected_option = models.PositiveIntegerField()  # 1–4, 0 = unattempted
    is_correct = models.BooleanField()
    score_awarded = models.FloatField()

    class Meta:
        unique_together = (('sturecid', 'test_code', 'question_number'),)

    def __str__(self):
        return f"{self.sturecid.sturecid} - {self.test_code.test_code} Q{self.question_number}"

# ----------------------------------------
# AGGREGATED FACT/SUMMARY: STUDENT TEST PERFORMANCE
# ----------------------------------------
class StudentTestPerformance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    total_score = models.FloatField()
    rank = models.PositiveIntegerField(null=True, blank=True) # Rank can be null initially, populated later

    class Meta:
        unique_together = (('student', 'test'),) # A student can only have one performance record per test
        ordering = ['test', '-total_score'] # Default ordering for easier rank calculation

    def __str__(self):
        return f"Performance for {self.student.name} on {self.test.test_code}: Score={self.total_score}, Rank={self.rank if self.rank else 'N/A'}"


class StudentSubjectPerformance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    subject_tag = models.CharField(max_length=50) # The subject tag from the Question model
    subject_score = models.FloatField()          # Total score for this student in this subject on this test
    subject_rank = models.PositiveIntegerField(null=True, blank=True) # Rank within this subject for this test

    class Meta:
        # A student can only have one performance record for a specific subject on a specific test
        unique_together = (('student', 'test', 'subject_tag'),) 
        ordering = ['test', 'subject_tag', '-subject_score'] # Default ordering for easier rank calculation

    def __str__(self):
        return f"Perf for {self.student.name} on {self.test.test_code} ({self.subject_tag}): Score={self.subject_score}, Rank={self.subject_rank if self.subject_rank else 'N/A'}"
    