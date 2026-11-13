import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import * as courses from '../services/courseService'
import * as enrollments from '../services/enrollmentService'
import * as progress from '../services/progressService'
import * as exams from '../services/examService'
import * as certificates from '../services/certificateService'
import * as feedback from '../services/feedbackService'
import * as auth from '../services/authService'

export const keys = {
  courses: ['courses'],
  course: (slug) => ['course', slug],
  enrollments: ['enrollments'],
  progress: ['progress'],
  lessonProgress: (courseId) => ['lessonProgress', courseId],
  exam: (courseId) => ['exam', courseId],
  attempts: (examId) => ['attempts', examId],
  certificates: ['certificates'],
  certificate: (id) => ['certificate', id],
  feedbacks: ['feedbacks'],
  profile: (userId) => ['profile', userId],
}

const useUserId = () => useAuthStore((s) => s.session?.user?.id ?? null)

export const useCourses = () => useQuery({ queryKey: keys.courses, queryFn: courses.listCourses })

export const useCourse = (slug) =>
  useQuery({ queryKey: keys.course(slug), queryFn: () => courses.getCourseBySlug(slug), enabled: !!slug })

export function useMyEnrollments() {
  const userId = useUserId()
  return useQuery({ queryKey: keys.enrollments, queryFn: enrollments.listMyEnrollments, enabled: !!userId })
}

export function useMyProgress() {
  const userId = useUserId()
  return useQuery({ queryKey: keys.progress, queryFn: progress.getMyProgress, enabled: !!userId })
}

export function useLessonProgress(courseId, lessonIds) {
  const userId = useUserId()
  return useQuery({
    queryKey: keys.lessonProgress(courseId),
    queryFn: () => progress.getLessonProgress(lessonIds),
    enabled: !!userId && !!courseId && lessonIds.length > 0,
  })
}

export function useExam(courseId, enabled = true) {
  const userId = useUserId()
  return useQuery({
    queryKey: keys.exam(courseId),
    queryFn: () => exams.getExamForCourse(courseId),
    enabled: !!userId && !!courseId && enabled,
  })
}

export function useAttempts(examId) {
  return useQuery({ queryKey: keys.attempts(examId), queryFn: () => exams.listMyAttempts(examId), enabled: !!examId })
}

export function useMyCertificates() {
  const userId = useUserId()
  return useQuery({ queryKey: keys.certificates, queryFn: certificates.listMyCertificates, enabled: !!userId })
}

export function useCertificate(id) {
  return useQuery({ queryKey: keys.certificate(id), queryFn: () => certificates.getCertificate(id), enabled: !!id })
}

export const usePublicFeedbacks = () => useQuery({ queryKey: keys.feedbacks, queryFn: () => feedback.listPublicFeedbacks() })

export function useProfile() {
  const userId = useUserId()
  return useQuery({ queryKey: keys.profile(userId), queryFn: () => auth.getProfile(userId), enabled: !!userId })
}
