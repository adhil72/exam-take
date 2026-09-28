# Sprint 6 — Results, Grading & Analytics

> **Goal:** Auto-grade exams, display results, and provide analytics.

| Attribute        | Detail                               |
|------------------|--------------------------------------|
| **Duration**     | 1–2 weeks                            |
| **Priority**     | 🟡 High                              |
| **Dependencies** | Sprint 3 (Exam Session Engine)       |

---

## Objectives

1. Build the server-side auto-grading engine
2. Compute and persist final results for all students
3. Build the Admin Results Dashboard (Tables & Analytics)
4. Implement per-student detailed result views
5. Handle publishing results and optional cloud upload

---

## Tasks

### 6.1 Auto-Grading Engine

- [ ] Implement grading logic in `server/exam/grading.ts`
- [ ] MCQ Grading: Compare submitted choice with correct answer(s)
  - Award positive `marks` if exactly correct
  - Apply `negativeMarks` if incorrect
  - Award 0 if skipped
- [ ] Multi-MCQ Grading: Support partial marking (optional) or exact match
- [ ] Numerical Grading: Implement tolerance/range checking if required, or exact match
- [ ] Descriptive Grading: Flag as "Needs Manual Review" (marks = 0 initially)
- [ ] Update `answers` collection: set `isCorrect` and `marksAwarded` for every answer

**Acceptance Criteria:**
- Auto-grading accurately calculates marks based on the exam configuration
- Negative marking is applied correctly
- The `answers` collection is fully populated with grading data

---

### 6.2 Result Computation

- [ ] Implement `server/exam/result.ts`
- [ ] Aggregate data for each `exam_attempts` record:
  - Total Questions assigned
  - Attempted count
  - Correct count
  - Wrong count
  - Skipped count
  - Total possible marks
  - Marks obtained
  - Percentage
- [ ] Store aggregated data in the `results` collection
- [ ] Automatically run grading and computation when an exam session ends

**Schema — `results` (MongoDB Adaptation):**

| Field           | Type    | Description                              |
|-----------------|---------|------------------------------------------|
| _id             | String  | Unique ID (UUID)                         |
| attemptId       | String  | References `exam_attempts._id`           |
| studentId       | String  | References `synced_students._id`         |
| totalQuestions  | Number  | Number of questions assigned             |
| attempted       | Number  | Number of questions answered             |
| correct         | Number  | Number of correct answers                |
| wrong           | Number  | Number of wrong answers                  |
| skipped         | Number  | Number of skipped                        |
| totalMarks      | Number  | Maximum possible marks                   |
| marksObtained   | Number  | Actual marks obtained                    |
| percentage      | Number  | Percentage score                         |
| timeSpentMs     | Number  | Total time spent                         |
| gradedAt        | Date    | Timestamp                                |

**Acceptance Criteria:**
- Accurate roll-up summaries for every student
- Results are saved to the database immediately after the exam concludes

---

### 6.3 Admin Results Dashboard

- [ ] Create Results screen at `/results/:sessionId`
- [ ] Build Summary Cards:
  - Average Score
  - Highest Score
  - Pass Rate
  - Total Participants
- [ ] Build Results Table:
  - Columns: Rank, Student, Score, Percentage, Time Taken, Status
  - Sorting: Sort by Score (desc), Name, Time
  - Filtering: Filter by pass/fail or status
- [ ] Implement "Export CSV" functionality
  - Generate a downloadable CSV file containing the results table data

**Acceptance Criteria:**
- Admin can view a comprehensive summary of the exam session
- Results data is easily exportable

---

### 6.4 Analytics Charts

- [ ] Integrate a charting library (e.g., Recharts or Chart.js)
- [ ] Create "Score Distribution" histogram (e.g., 0-10%, 11-20%, ...)
- [ ] Create "Subject-wise Performance" bar chart (average score per subject)
- [ ] Create "Average Time per Question" chart (identifying difficult questions)

**Acceptance Criteria:**
- Visual analytics provide quick insights into overall performance
- Charts are responsive and accurate

---

### 6.5 Per-Student Detail View

- [ ] Allow clicking a row in the Results Table to open a detailed view
- [ ] Display the student's individual scorecard
- [ ] Show a Question-by-Question breakdown:
  - Question Text
  - Student's Answer
  - Correct Answer
  - Marks Awarded
  - Time Spent on that specific question
- [ ] Highlight Correct (green) vs Incorrect (red) answers

**Acceptance Criteria:**
- Admin can audit exactly how a student performed on every question

---

### 6.6 Publishing & Cloud Sync

- [ ] "Publish Results" button:
  - Changes session status to `results_published`
  - Emits `result:published` WebSocket event to connected clients
- [ ] "Upload to Cloud" button (Optional Sprint Goal):
  - Sends the aggregated results back to the main GExam cloud server via REST API
  - Handles authentication and error reporting

**Acceptance Criteria:**
- Admin controls when students see their results
- Cloud sync (if implemented) successfully pushes data back to the central system

---

## Deliverables Summary

| # | Deliverable                                                        | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | Server-side auto-grading and aggregation logic                     | ⬜     |
| 2 | Admin Results Dashboard with summary table and CSV export          | ⬜     |
| 3 | Visual analytics charts (Distribution, Subject performance)        | ⬜     |
| 4 | Detailed per-student question-by-question view                     | ⬜     |
| 5 | Functionality to publish results to clients                        | ⬜     |

---

## Technical Notes

- Grading logic must perfectly handle floating-point arithmetic (e.g., `0.1 + 0.2` issues) for precise marking.
- Use MongoDB aggregation pipelines for generating analytics data efficiently.
