/**
 * African Film & Creative Arts Academy (AFCA) Service
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §28 / VMNL-AZP-VMN-CCPP-001 §11
 *
 * Core Mandate:
 * Formal structured learning, assessment, cohort management, and verifiable credential certification.
 * Invariant: Certificates cannot be issued until all required assessments have passing scores.
 */

import { createHash } from "node:crypto";

export type CourseLevel = "FOUNDATION" | "INTERMEDIATE" | "ADVANCED" | "MASTERCLASS";
export type CohortStatus = "UPCOMING" | "OPEN_ENROLLMENT" | "IN_SESSION" | "GRADING" | "COMPLETED" | "ARCHIVED";
export type EnrollmentStatus = "APPLIED" | "ACCEPTED" | "ENROLLED" | "DEFERRED" | "DROPPED" | "GRADUATED";
export type CertificateDistinction = "PASS" | "MERIT" | "DISTINCTION";

export interface CourseModule {
  id: string;
  moduleCode: string;
  title: string;
  syllabus: string;
  learningHours: number;
}

export interface Course {
  id: string;
  courseCode: string;
  title: string;
  description: string;
  level: CourseLevel;
  totalCredits: number;
  passingScore: number; // e.g. 70
  prerequisiteCourseIds: string[];
  modules: CourseModule[];
  createdAt: Date;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number; // e.g. 0.25 (total weights sum to 1.0)
}

export interface AssessmentProject {
  id: string;
  courseId: string;
  title: string;
  description: string;
  submissionDeadline: Date;
  rubric: RubricCriterion[];
}

export interface AssessmentScore {
  criterionId: string;
  score: number;
  feedback?: string;
}

export interface StudentSubmission {
  id: string;
  projectId: string;
  studentId: string;
  cohortId: string;
  deliverableUrl: string;
  submittedAt: Date;
  gradedBy?: string;
  gradedAt?: Date;
  scores: AssessmentScore[];
  calculatedScorePercent?: number; // 0 - 100
  passed?: boolean;
}

export interface CohortEnrollment {
  id: string;
  cohortId: string;
  studentId: string;
  enrolledAt: Date;
  status: EnrollmentStatus;
  attendanceRate: number; // 0.0 - 1.0
  finalGradePercent?: number;
  graduatedAt?: Date;
}

export interface AfcaCertificate {
  certificateId: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  cohortId: string;
  cohortCode: string;
  issueDate: Date;
  finalScorePercent: number;
  distinction: CertificateDistinction;
  verificationTokenSha256: string;
  verificationUrl: string;
  qrPayload: string;
}

export interface Cohort {
  id: string;
  cohortCode: string; // e.g. "AFCA-2026-CIN-C1"
  courseId: string;
  leadInstructorId: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  status: CohortStatus;
  enrollments: Map<string, CohortEnrollment>;
}

export class AfcaAcademyService {
  private courses = new Map<string, Course>();
  private projects = new Map<string, AssessmentProject>();
  private cohorts = new Map<string, Cohort>();
  private submissions = new Map<string, StudentSubmission>();
  private certificates = new Map<string, AfcaCertificate>();
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.APP_URL || "http://localhost:5500").replace(/\/+$/, "");
  }

  public createCourse(course: Course): Course {
    if (this.courses.has(course.id)) {
      throw new Error(`[AFCA-CRS-01] Course '${course.id}' already exists.`);
    }
    this.courses.set(course.id, course);
    return course;
  }

  public getCourse(id: string): Course | undefined {
    return this.courses.get(id);
  }

  public createAssessmentProject(project: AssessmentProject): AssessmentProject {
    const course = this.courses.get(project.courseId);
    if (!course) {
      throw new Error(`[AFCA-PRJ-01] Course '${project.courseId}' not found.`);
    }

    const totalWeight = project.rubric.reduce((sum, r) => sum + r.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error(`[AFCA-PRJ-02] Rubric weights must sum to exactly 1.0. Got: ${totalWeight}`);
    }

    this.projects.set(project.id, project);
    return project;
  }

  public createCohort(params: {
    id: string;
    cohortCode: string;
    courseId: string;
    leadInstructorId: string;
    startDate: Date;
    endDate: Date;
    capacity: number;
  }): Cohort {
    if (!this.courses.has(params.courseId)) {
      throw new Error(`[AFCA-COH-01] Course '${params.courseId}' not found.`);
    }
    if (params.endDate <= params.startDate) {
      throw new Error("[AFCA-COH-02] Cohort endDate must be strictly after startDate.");
    }

    const cohort: Cohort = {
      ...params,
      status: "UPCOMING",
      enrollments: new Map(),
    };
    this.cohorts.set(cohort.id, cohort);
    return cohort;
  }

  public enrollStudent(cohortId: string, studentId: string): CohortEnrollment {
    const cohort = this.getCohortOrThrow(cohortId);
    if (cohort.enrollments.size >= cohort.capacity) {
      throw new Error(`[AFCA-ENR-01] Cohort '${cohort.cohortCode}' has reached full capacity of ${cohort.capacity}.`);
    }
    if (cohort.enrollments.has(studentId)) {
      throw new Error(`[AFCA-ENR-02] Student '${studentId}' is already enrolled in cohort '${cohort.cohortCode}'.`);
    }

    const enrollment: CohortEnrollment = {
      id: `ENR-${Date.now()}-${studentId}`,
      cohortId,
      studentId,
      enrolledAt: new Date(),
      status: "ENROLLED",
      attendanceRate: 1.0,
    };

    cohort.enrollments.set(studentId, enrollment);
    return enrollment;
  }

  public submitProjectDeliverable(params: {
    id: string;
    projectId: string;
    studentId: string;
    cohortId: string;
    deliverableUrl: string;
  }): StudentSubmission {
    if (!this.projects.has(params.projectId)) {
      throw new Error(`[AFCA-SUB-01] Project '${params.projectId}' not found.`);
    }

    const cohort = this.getCohortOrThrow(params.cohortId);
    if (!cohort.enrollments.has(params.studentId)) {
      throw new Error(`[AFCA-SUB-02] Student '${params.studentId}' not enrolled in cohort '${params.cohortId}'.`);
    }

    const submission: StudentSubmission = {
      id: params.id,
      projectId: params.projectId,
      studentId: params.studentId,
      cohortId: params.cohortId,
      deliverableUrl: params.deliverableUrl,
      submittedAt: new Date(),
      scores: [],
    };

    this.submissions.set(submission.id, submission);
    return submission;
  }

  public gradeProjectSubmission(
    submissionId: string,
    graderId: string,
    scores: AssessmentScore[]
  ): StudentSubmission {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new Error(`[AFCA-GRD-01] Submission '${submissionId}' not found.`);
    }

    const project = this.projects.get(submission.projectId);
    if (!project) {
      throw new Error(`[AFCA-GRD-02] Assessment Project '${submission.projectId}' not found.`);
    }

    const course = this.courses.get(project.courseId);
    if (!course) {
      throw new Error(`[AFCA-GRD-03] Associated Course '${project.courseId}' not found.`);
    }

    // Verify all rubric criteria are scored
    for (const criterion of project.rubric) {
      const match = scores.find((s) => s.criterionId === criterion.id);
      if (!match) {
        throw new Error(`[AFCA-GRD-04] Missing score for required rubric criterion '${criterion.name}'.`);
      }
      if (match.score < 0 || match.score > criterion.maxScore) {
        throw new Error(
          `[AFCA-GRD-05] Score ${match.score} out of bounds for criterion '${criterion.name}' (max ${criterion.maxScore}).`
        );
      }
    }

    // Calculate weighted percentage
    let totalWeightedScore = 0;
    for (const criterion of project.rubric) {
      const s = scores.find((sc) => sc.criterionId === criterion.id)!;
      const percent = (s.score / criterion.maxScore) * 100;
      totalWeightedScore += percent * criterion.weight;
    }

    const passingScore = course.passingScore || 70;
    submission.gradedBy = graderId;
    submission.gradedAt = new Date();
    submission.scores = scores;
    submission.calculatedScorePercent = Math.round(totalWeightedScore * 100) / 100;
    submission.passed = submission.calculatedScorePercent >= passingScore;

    return submission;
  }

  /**
   * Generates a digital verifiable certificate.
   * INVARIANT: Student must have completed ALL required course projects with PASSING scores.
   */
  public issueCertificate(cohortId: string, studentId: string): AfcaCertificate {
    const cohort = this.getCohortOrThrow(cohortId);
    const course = this.courses.get(cohort.courseId);
    if (!course) {
      throw new Error(`[AFCA-CERT-01] Course '${cohort.courseId}' not found.`);
    }

    const enrollment = cohort.enrollments.get(studentId);
    if (!enrollment) {
      throw new Error(`[AFCA-CERT-02] Student '${studentId}' not enrolled in cohort.`);
    }

    // Find all projects for this course
    const courseProjects = Array.from(this.projects.values()).filter((p) => p.courseId === course.id);
    if (courseProjects.length === 0) {
      throw new Error(`[AFCA-CERT-03] Course '${course.courseCode}' has no registered assessment projects.`);
    }

    // Verify all projects have passing submissions
    const studentSubmissions = Array.from(this.submissions.values()).filter(
      (s) => s.studentId === studentId && s.cohortId === cohortId
    );

    let totalScoreSum = 0;
    for (const project of courseProjects) {
      const sub = studentSubmissions.find((s) => s.projectId === project.id);
      if (!sub) {
        throw new Error(
          `[AFCA-CERT-04] Cannot issue certificate: Required assessment '${project.title}' has not been submitted.`
        );
      }
      if (!sub.gradedAt) {
        throw new Error(
          `[AFCA-CERT-05] Cannot issue certificate: Assessment '${project.title}' is pending evaluation.`
        );
      }
      if (!sub.passed) {
        throw new Error(
          `[AFCA-CERT-06] Cannot issue certificate: Assessment '${project.title}' failed (${sub.calculatedScorePercent}% < ${course.passingScore}%).`
        );
      }
      totalScoreSum += sub.calculatedScorePercent!;
    }

    const avgScore = Math.round((totalScoreSum / courseProjects.length) * 100) / 100;

    let distinction: CertificateDistinction = "PASS";
    if (avgScore >= 85) {
      distinction = "DISTINCTION";
    } else if (avgScore >= 75) {
      distinction = "MERIT";
    }

    const issueDate = new Date();
    const tokenPreimage = `${studentId}:${course.id}:${cohort.id}:${avgScore}:${distinction}:${issueDate.toISOString()}`;
    const tokenSha256 = createHash("sha256").update(tokenPreimage).digest("hex");
    const certificateId = `AFCA-CERT-${issueDate.getFullYear()}-${tokenSha256.substring(0, 10).toUpperCase()}`;

    const cert: AfcaCertificate = {
      certificateId,
      studentId,
      courseId: course.id,
      courseTitle: course.title,
      cohortId: cohort.id,
      cohortCode: cohort.cohortCode,
      issueDate,
      finalScorePercent: avgScore,
      distinction,
      verificationTokenSha256: tokenSha256,
      verificationUrl: `${this.baseUrl}/verify/afca/${certificateId}`,
      qrPayload: JSON.stringify({
        certId: certificateId,
        studentId,
        courseCode: course.courseCode,
        distinction,
        hash: tokenSha256.substring(0, 16),
      }),
    };

    enrollment.status = "GRADUATED";
    enrollment.finalGradePercent = avgScore;
    enrollment.graduatedAt = issueDate;

    this.certificates.set(certificateId, cert);
    return cert;
  }

  public verifyCertificate(certificateId: string): { valid: boolean; certificate?: AfcaCertificate } {
    const cert = this.certificates.get(certificateId);
    if (!cert) {
      return { valid: false };
    }
    return { valid: true, certificate: cert };
  }

  private getCohortOrThrow(cohortId: string): Cohort {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) {
      throw new Error(`[AFCA-ERR-404] Cohort '${cohortId}' not found.`);
    }
    return cohort;
  }
}
