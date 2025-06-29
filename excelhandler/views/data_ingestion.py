# excelhandler/views.py

import os
import csv
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db import models
import calendar
from excelhandler.models import Student, Test, Question, StudentResponse, Institution, Batch, StudentTestPerformance, StudentSubjectPerformance
from django.db.models.expressions import Window, OuterRef, Subquery
from django.db.models.functions import DenseRank, Coalesce, ExtractMonth, ExtractYear, Concat
from django.db.models import CharField, F, Q, Case, When, Value, Avg, Sum, Count, FloatField

@csrf_exempt
# >>> VERIFY THIS FUNCTION NAME <<<
def upload_and_process_data(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed.'}, status=405)

    sr_file = request.FILES.get('sr_file')
    ak_file = request.FILES.get('ak_file')

    if not sr_file:
        return JsonResponse({'status': 'error', 'message': 'SR.csv file is missing from the request.'}, status=400)
    if not ak_file:
        return JsonResponse({'status': 'error', 'message': 'AK.csv file is missing from the request.'}, status=400)

    print("Starting data ingestion process...")
    try:
        sr_reader = list(csv.reader(sr_file.read().decode('ISO-8859-1').splitlines()))
        ak_reader = list(csv.reader(ak_file.read().decode('ISO-8859-1').splitlines()))

        if not sr_reader:
            return JsonResponse({'status': 'error', 'message': 'SR.csv is empty or unreadable after upload.'}, status=400)
        if not ak_reader:
            return JsonResponse({'status': 'error', 'message': 'AK.csv is empty or unreadable after upload.'}, status=400)

        with transaction.atomic():
            # --- PHASE 1: Load SR.csv (Student Responses & Core Data) ---
            print("\n--- PHASE 1: Loading SR.csv (Student Responses & Core Data) ---")
            headers = sr_reader[0]
            print(f"Processing {len(sr_reader) - 1} rows from SR.csv...")
            for row_num, row in enumerate(sr_reader[1:], start=1):
                try:
                    row_data = dict(zip(headers, row))
                    institution_name_val = row_data.get('Institution', '').strip()
                    if not institution_name_val:
                        print(f"    Warning: Skipping SR.csv row {row_num} due to missing Institution name.")
                        continue
                    institution, created_inst = Institution.objects.get_or_create(name=institution_name_val)
                    batch_name_val = row_data.get('Batch', '').strip()
                    if not batch_name_val:
                        print(f"    Warning: Skipping SR.csv row {row_num} due to missing Batch name.")
                        continue
                    batch, created_batch = Batch.objects.get_or_create(name=batch_name_val, institution=institution)
                    sturecid_val = row_data.get('sturecid')
                    if not sturecid_val:
                        print(f"    Warning: Skipping SR.csv row {row_num} due to missing sturecid.")
                        continue
                    student, created = Student.objects.get_or_create(
                        sturecid=sturecid_val,
                        defaults={
                            'name': row_data.get('sname', ''),
                            'student_class': row_data.get('class', ''),
                            'section': row_data.get('sec'),
                            'claid': row_data.get('claid'),
                        }
                    )
                    test_code_val = str(row_data.get('testid', '')).strip()
                    if not test_code_val:
                        print(f"    Warning: Skipping SR.csv row {row_num} due to missing testid.")
                        continue
                    test_date_str = row_data.get('exdate')
                    test_date = None
                    if test_date_str:
                        try:
                            test_date = datetime.strptime(test_date_str, "%d-%m-%Y").date()
                        except ValueError:
                            print(f"    Warning: Invalid date format '{test_date_str}' in SR.csv row {row_num}. Expected DD-MM-YYYY. Test date will be null for Test ID '{test_code_val}'.")
                    full_subject_string = row_data.get('subject', '')
                    extracted_test_type = full_subject_string.split(' - ')[0].strip()
                    test, created_test = Test.objects.update_or_create(
                        test_code=test_code_val,
                        defaults={
                            'test_type': extracted_test_type,
                            'test_date': test_date,
                            'institution': institution,
                            'batch': batch,
                        }
                    )
                    for i in range(1, 181):
                        q_col = f'a{i}'
                        selected_option_val = row_data.get(q_col)
                        selected_option = 0
                        if selected_option_val and selected_option_val.strip():
                            try:
                                selected_option = int(float(selected_option_val))
                            except ValueError:
                                print(f"        Warning: Invalid selected option '{selected_option_val}' for Q{i} (Test: {test.test_code}) in SR.csv row {row_num}. Defaulting to 0.")
                        sr_obj, created_sr = StudentResponse.objects.update_or_create(
                            sturecid=student,
                            test_code=test,
                            question_number=i,
                            defaults={
                                'selected_option': selected_option,
                                'is_correct': False,
                                'score_awarded': 0.0
                            }
                        )
                except Exception as e:
                    print(f"Error processing SR.csv row {row_num}: {e} (Row data: {row})")
                    raise

            print("--- PHASE 1: SR.csv initial processing complete. ---")

            # --- PHASE 2: Loading AK.csv (Answer Key) ---
            print("\n--- PHASE 2: Loading AK.csv (Answer Key) ---")
            print(f"Processing {len(ak_reader) - 1} rows from AK.csv...")
            for row_num, row in enumerate(ak_reader[1:], start=1):
                try:
                    question_number_val = int(row[0].strip())
                    test_code_val = str(row[1]).strip()
                    subject_tag_val = str(row[2]).strip() if row[2].strip() else None
                    correct_option_val = int(float(row[3])) if row[3] and row[3].strip() else 0
                    try:
                        test_obj = Test.objects.get(test_code=test_code_val)
                    except Test.DoesNotExist:
                        print(f"    Warning: Test '{test_code_val}' from AK.csv row {row_num} not found in database (likely not in SR.csv). Cannot create Question without associated Test. Skipping this question.")
                        continue
                    question, created_q = Question.objects.update_or_create(
                        test_code=test_obj,
                        question_number=question_number_val,
                        defaults={
                            'correct_option': correct_option_val,
                            'subject_tag': subject_tag_val
                        }
                    )
                except ValueError as ve:
                    print(f"    Warning: Skipping AK.csv row {row_num} due to data type error: {ve} (Row data: {row})")
                except IndexError as ie:
                    print(f"    Warning: Skipping AK.csv row {row_num} due to missing columns: {ie} (Row data: {row}). Ensure at least 4 columns.")
                except Exception as e:
                    print(f"    Error processing AK.csv row {row_num}: {e} (Row data: {row})")
                    raise

            print("--- PHASE 2: AK.csv processing complete. ---")

            # --- PHASE 3: Updating Student Responses with correctness and scores ---
            print("\n--- PHASE 3: Updating Student Responses with correctness and scores ---")
            all_student_responses = StudentResponse.objects.select_related('test_code').all()
            total_sr_updated = 0
            for sr_obj in all_student_responses:
                try:
                    question_obj = Question.objects.get(
                        test_code=sr_obj.test_code,
                        question_number=sr_obj.question_number
                    )
                    is_correct_val = sr_obj.selected_option == question_obj.correct_option
                    score_awarded_val = 0.0
                    if sr_obj.selected_option == 0:
                        score_awarded_val = 0.0
                    elif is_correct_val:
                        score_awarded_val = 4.0
                    else:
                        score_awarded_val = -1.0
                    if sr_obj.is_correct != is_correct_val or sr_obj.score_awarded != score_awarded_val:
                        sr_obj.is_correct = is_correct_val
                        sr_obj.score_awarded = score_awarded_val
                        sr_obj.save(update_fields=['is_correct', 'score_awarded'])
                        total_sr_updated += 1
                except Question.DoesNotExist:
                    pass
                except Exception as e:
                    print(f"    Error updating StudentResponse {sr_obj.sturecid.sturecid}-{sr_obj.test_code.test_code}-Q{sr_obj.question_number}: {e}")
            print(f"--- PHASE 3: Updated {total_sr_updated} Student Responses. ---")

            # --- PHASE 4: Calculating and storing Student Test Performance and Ranks ---
            print("\n--- PHASE 4: Calculating and storing Student Test Performance and Ranks ---")
            print("    Calculating total scores per student per test...")
            student_test_scores = StudentResponse.objects \
                .values('sturecid', 'test_code') \
                .annotate(total_score=Sum('score_awarded')) \
                .order_by('sturecid', 'test_code')
            total_performance_records = 0
            for entry in student_test_scores:
                student_obj = Student.objects.get(sturecid=entry['sturecid'])
                test_obj = Test.objects.get(test_code=entry['test_code'])
                performance_obj, created = StudentTestPerformance.objects.update_or_create(
                    student=student_obj,
                    test=test_obj,
                    defaults={
                        'total_score': entry['total_score'],
                        'rank': None
                    }
                )
                if created:
                    total_performance_records += 1
            print(f"    Updated/Created {total_performance_records} StudentTestPerformance records with total scores.")
            print("    Calculating ranks for each test...")
            all_tests = Test.objects.all()
            total_ranks_updated = 0
            for test_obj in all_tests:
                ranked_performances = StudentTestPerformance.objects.filter(test=test_obj) \
                    .annotate(
                        calculated_rank=Window(
                            expression=DenseRank(),
                            order_by=models.F('total_score').desc()
                        )
                    ).order_by('calculated_rank')
                for performance_obj in ranked_performances:
                    if performance_obj.rank != performance_obj.calculated_rank:
                        performance_obj.rank = performance_obj.calculated_rank
                        performance_obj.save(update_fields=['rank'])
                        total_ranks_updated += 1
            print(f"--- PHASE 4: Calculated and updated ranks for {total_ranks_updated} performance records. ---")

            # --- PHASE 5: Calculating and storing Student Subject Performance and Ranks ---
            print("\n--- PHASE 5: Calculating and storing Student Subject Performance and Ranks ---")
            print("    Calculating total subject scores per student per test per subject...")
            question_subject_tag_subquery = Subquery(
                Question.objects.filter(
                    test_code=OuterRef('test_code'),
                    question_number=OuterRef('question_number')
                ).values('subject_tag')[:1],
                output_field=CharField()
            )
            student_subject_scores = StudentResponse.objects \
                .annotate(
                    specific_question_subject_tag=question_subject_tag_subquery
                ) \
                .filter(specific_question_subject_tag__isnull=False) \
                .values('sturecid', 'test_code', 'specific_question_subject_tag') \
                .annotate(
                    subject_score=Coalesce(Sum('score_awarded'), 0.0)
                ) \
                .order_by('sturecid', 'test_code', 'specific_question_subject_tag')
            total_subject_performance_records = 0
            for entry in student_subject_scores:
                student_obj = Student.objects.get(sturecid=entry['sturecid'])
                test_obj = Test.objects.get(test_code=entry['test_code'])
                subject_tag_val = entry['specific_question_subject_tag']
                if subject_tag_val:
                    performance_obj, created = StudentSubjectPerformance.objects.update_or_create(
                        student=student_obj,
                        test=test_obj,
                        subject_tag=subject_tag_val,
                        defaults={
                            'subject_score': entry['subject_score'],
                            'subject_rank': None
                        }
                    )
                    if created:
                        total_subject_performance_records += 1
            print(f"    Updated/Created {total_subject_performance_records} StudentSubjectPerformance records with subject scores.")
            print("    Calculating subject ranks for each test and subject combination...")
            unique_test_subjects = StudentSubjectPerformance.objects.values('test', 'subject_tag').distinct()
            total_subject_ranks_updated = 0
            for combo in unique_test_subjects:
                test_id = combo['test']
                subject_tag = combo['subject_tag']
                ranked_subject_performances = StudentSubjectPerformance.objects.filter(
                    test_id=test_id,
                    subject_tag=subject_tag
                ).annotate(
                    calculated_rank=Window(
                        expression=DenseRank(),
                        order_by=models.F('subject_score').desc()
                    )
                ).order_by('calculated_rank')
                for performance_obj in ranked_subject_performances:
                    if performance_obj.subject_rank != performance_obj.calculated_rank:
                        performance_obj.subject_rank = performance_obj.calculated_rank
                        performance_obj.save(update_fields=['subject_rank'])
                        total_subject_ranks_updated += 1
            print(f"--- PHASE 5: Calculated and updated subject ranks for {total_subject_ranks_updated} performance records. ---")

            print("\n✅ All data loaded successfully. Check server console for details.")
            return JsonResponse({'status': 'success', 'message': 'All data loaded successfully.'})
    except Exception as e:
        print(f"An unexpected error occurred during data ingestion: {e}")
        return JsonResponse({'status': 'error', 'message': f'Data ingestion failed: {str(e)}. Please check server logs for more details.'}, status=500)