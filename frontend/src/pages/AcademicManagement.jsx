import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  FileText,
  ShieldAlert,
  ArrowRight,
  Database,
} from 'lucide-react';

const AcademicManagement = () => {
  // Student Bulk Import States
  const [studentFile, setStudentFile] = useState(null);
  const [importingStudents, setImportingStudents] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [studentError, setStudentError] = useState(null);
  const [dragActiveStudent, setDragActiveStudent] = useState(false);
  const studentFileInputRef = useRef(null);

  // Course Bulk Enrollment States
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollFile, setEnrollFile] = useState(null);
  const [pasteRollNumbers, setPasteRollNumbers] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState(null);
  const [enrollError, setEnrollError] = useState(null);
  const enrollFileInputRef = useRef(null);

  // Fetch all courses for dropdown
  const fetchCourses = async () => {
    try {
      const res = await axiosClient.get('/attendance/courses');
      const list = res.data.courses || [];
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0]._id);
      }
    } catch (err) {
      console.error('Error fetching courses for admin:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Download sample CSV template
  const handleDownloadSampleCSV = () => {
    const csvContent =
      'name,email,rollNumber,department\n' +
      'Aarav Sharma,aarav.sharma@example.com,24CS110,Computer Science\n' +
      'Diya Patel,diya.patel@example.com,24CS111,Computer Science\n' +
      'Rohan Verma,rohan.verma@example.com,24CS112,Information Technology\n' +
      'Sneha Iyer,sneha.iyer@example.com,24CS113,Electronics & Communication\n' +
      'Kabir Singh,kabir.singh@example.com,24CS114,Computer Science\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campusone_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and drop handlers for student upload
  const handleStudentDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveStudent(true);
    } else if (e.type === 'dragleave') {
      setDragActiveStudent(false);
    }
  };

  const handleStudentDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveStudent(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(csv|xlsx|xls)$/i)) {
        setStudentFile(file);
        setStudentError(null);
      } else {
        setStudentError('Please upload a .csv or .xlsx file');
      }
    }
  };

  // Submit Bulk Student Upload
  const handleUploadStudents = async (e) => {
    e.preventDefault();
    if (!studentFile) {
      setStudentError('Please choose a .csv or .xlsx file to upload');
      return;
    }

    setImportingStudents(true);
    setStudentError(null);
    setStudentResult(null);

    const formData = new FormData();
    formData.append('file', studentFile);

    try {
      const res = await axiosClient.post('/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStudentResult(res.data);
      setStudentFile(null);
      if (studentFileInputRef.current) {
        studentFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error during bulk student upload:', err);
      setStudentError(
        err.response?.data?.message || 'Server error occurred during bulk student import'
      );
    } finally {
      setImportingStudents(false);
    }
  };

  // Submit Bulk Course Enrollment
  const handleBulkEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setEnrollError('Please select a course to enroll students into');
      return;
    }

    if (!enrollFile && !pasteRollNumbers.trim()) {
      setEnrollError('Please either upload a file or paste roll numbers/emails');
      return;
    }

    setEnrolling(true);
    setEnrollError(null);
    setEnrollResult(null);

    const formData = new FormData();
    formData.append('courseId', selectedCourseId);

    if (enrollFile) {
      formData.append('file', enrollFile);
    } else {
      formData.append('rollNumbers', pasteRollNumbers);
    }

    try {
      const res = await axiosClient.post('/admin/courses/bulk-enroll', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEnrollResult(res.data);
      setEnrollFile(null);
      setPasteRollNumbers('');
      if (enrollFileInputRef.current) {
        enrollFileInputRef.current.value = '';
      }
      fetchCourses();
    } catch (err) {
      console.error('Error during course bulk enrollment:', err);
      setEnrollError(
        err.response?.data?.message || 'Failed to bulk enroll students into course'
      );
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Database className="w-7 h-7 text-campus-600" />
          Academic Onboarding & Bulk Operations
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Automate high-volume student account creation and cohort course enrollments via CSV / Excel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ======================================================== */}
        {/* CARD 1: BULK STUDENT IMPORT                             */}
        {/* ======================================================== */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-campus-50 text-campus-600 border border-campus-200">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Bulk Student Import
                  </h3>
                  <p className="text-sm text-slate-500">
                    Import hundreds of student accounts in one batch
                  </p>
                </div>
              </div>

              {/* Download CSV Template Button */}
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
                title="Download CSV sample format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
            </div>

            {/* Error Banner */}
            {studentError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{studentError}</span>
              </div>
            )}

            {/* Success Result Banner */}
            {studentResult && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm shadow-sm">
                <div className="flex items-center gap-2 font-bold mb-1 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Batch Processing Finished</span>
                </div>
                <p className="leading-relaxed">{studentResult.message}</p>
                <div className="mt-2.5 flex items-center gap-4 text-xs font-bold text-emerald-700">
                  <span>Imported: {studentResult.successCount}</span>
                  <span>Duplicates Skipped: {studentResult.duplicateCount}</span>
                  <span>Total Rows: {studentResult.totalProcessed}</span>
                </div>
              </div>
            )}

            {/* Drag and Drop Upload Zone */}
            <form onSubmit={handleUploadStudents} className="mt-5 space-y-4">
              <div
                onDragEnter={handleStudentDrag}
                onDragLeave={handleStudentDrag}
                onDragOver={handleStudentDrag}
                onDrop={handleStudentDrop}
                onClick={() => studentFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActiveStudent
                    ? 'border-campus-500 bg-campus-50/70'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                }`}
              >
                <input
                  ref={studentFileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setStudentFile(e.target.files[0]);
                      setStudentError(null);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-campus-100 text-campus-600 mx-auto mb-3 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drag & drop student spreadsheet
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports <strong className="text-slate-600">.csv</strong> and{' '}
                  <strong className="text-slate-600">.xlsx</strong> files (up to 15MB)
                </p>

                <div className="mt-3 inline-block px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-600">
                  Required columns: name, email, rollNumber, department
                </div>
              </div>

              {/* Selected File Card */}
              {studentFile && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="block text-sm font-bold text-slate-900 truncate">
                        {studentFile.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {(studentFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentFile(null);
                      if (studentFileInputRef.current) {
                        studentFileInputRef.current.value = '';
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={importingStudents || !studentFile}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-sm shadow-md shadow-campus-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {importingStudents ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing & Inserting Records...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Process Students</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: COURSE BULK ENROLLMENT                          */}
        {/* ======================================================== */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Course Batch Enrollment
                  </h3>
                  <p className="text-sm text-slate-500">
                    Enroll students into courses using roll numbers or spreadsheet
                  </p>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {enrollError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            {/* Success Result Banner */}
            {enrollResult && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm shadow-sm">
                <div className="flex items-center gap-2 font-bold mb-1 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Batch Enrollment Complete</span>
                </div>
                <p className="leading-relaxed">{enrollResult.message}</p>
                <div className="mt-2 flex items-center gap-4 text-xs font-bold text-emerald-700">
                  <span>Enrolled: {enrollResult.enrolledCount} students</span>
                  <span>Total Now Enrolled: {enrollResult.totalEnrolledNow}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleBulkEnroll} className="mt-5 space-y-4">
              {/* Target Course Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Select Target Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 text-sm font-semibold text-slate-800 outline-none"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode}: {c.courseName} (Faculty: {c.facultyId?.name || 'Assigned'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Paste Roll Numbers Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Paste Roll Numbers or Emails
                  </label>
                  <span className="text-xs text-slate-500">
                    Comma, space, or newline separated
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={pasteRollNumbers}
                  onChange={(e) => {
                    setPasteRollNumbers(e.target.value);
                    if (e.target.value) setEnrollFile(null);
                  }}
                  placeholder="24CS101, 24CS102, 24CS103&#10;24CS110&#10;24CS111"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 text-sm font-mono outline-none"
                />
              </div>

              {/* Optional: Or Upload File */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  — Or Upload Roll Numbers Spreadsheet —
                </span>
                <input
                  ref={enrollFileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEnrollFile(e.target.files[0]);
                      setPasteRollNumbers('');
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {enrollFile && (
                  <span className="block text-sm text-purple-700 font-semibold mt-1">
                    Selected: {enrollFile.name}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={enrolling || (!enrollFile && !pasteRollNumbers.trim())}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Students...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Enroll Batch into Course</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicManagement;
