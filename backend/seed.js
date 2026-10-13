const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Course = require('./models/Course');
const AttendanceSession = require('./models/AttendanceSession');
const AttendanceRecord = require('./models/AttendanceRecord');
const Assignment = require('./models/Assignment');
const CampusEvent = require('./models/CampusEvent');
const Complaint = require('./models/Complaint');
const LostAndFound = require('./models/LostAndFound');
const RoomBooking = require('./models/RoomBooking');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas.');

    // Clear existing records
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      Assignment.deleteMany({}),
      CampusEvent.deleteMany({}),
      Complaint.deleteMany({}),
      LostAndFound.deleteMany({}),
      RoomBooking.deleteMany({}),
    ]);
    console.log('✅ Cleared old collections.');

    // 1. Create Users
    console.log('Creating users...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@campusone.edu',
      password: 'Admin@123',
      role: 'admin',
      department: 'Administration',
      rollOrFacultyId: 'ADM-001',
    });

    const faculty = await User.create({
      name: 'Dr. Alan Turing',
      email: 'faculty@campusone.edu',
      password: 'Faculty@123',
      role: 'faculty',
      department: 'Computer Science',
      rollOrFacultyId: 'FAC-CS-101',
    });

    const student1 = await User.create({
      name: 'Vijay Sharma',
      email: 'student@campusone.edu',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
      rollOrFacultyId: '24CS101',
    });

    const student2 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@campusone.edu',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
      rollOrFacultyId: '24CS102',
    });

    const student3 = await User.create({
      name: 'Priya Singh',
      email: 'priya@campusone.edu',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
      rollOrFacultyId: '24CS103',
    });

    console.log('✅ Created 1 Admin, 1 Faculty, and 3 Students.');

    // 2. Create Courses
    console.log('Creating courses...');
    const course1 = await Course.create({
      courseCode: 'CS301',
      courseName: 'Data Structures and Algorithms',
      department: 'Computer Science',
      facultyId: faculty._id,
      enrolledStudents: [student1._id, student2._id, student3._id],
    });

    const course2 = await Course.create({
      courseCode: 'CS302',
      courseName: 'Operating Systems',
      department: 'Computer Science',
      facultyId: faculty._id,
      enrolledStudents: [student1._id, student2._id, student3._id],
    });

    console.log('✅ Created courses: CS301 and CS302.');

    // 3. Create Attendance Sessions and Records
    console.log('Seeding attendance sessions & records...');
    const sessionDates = [
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    ];

    const topicsCS301 = [
      'Arrays & Linked Lists Analysis',
      'Binary Search Trees & Traversal',
      'Balanced AVL Tree Rotations',
      'Graph Search: BFS and DFS',
    ];

    const topicsCS302 = [
      'Kernel Architecture & System Calls',
      'CPU Scheduling Algorithms',
      'Process Synchronization & Locks',
      'Virtual Memory & Page Replacement',
    ];

    for (let i = 0; i < sessionDates.length; i++) {
      // CS301 Session
      const sess1 = await AttendanceSession.create({
        courseId: course1._id,
        facultyId: faculty._id,
        date: sessionDates[i],
        topicOrSlot: topicsCS301[i],
      });

      // Vijay: 4/4 Present (100% -> Green Safe)
      // Rahul: 2/4 Present (50% -> Red Warning <75%)
      // Priya: 4/4 Present (100% -> Green Safe)
      await AttendanceRecord.create([
        {
          sessionId: sess1._id,
          studentId: student1._id,
          courseId: course1._id,
          status: 'Present',
          markedAt: sessionDates[i],
        },
        {
          sessionId: sess1._id,
          studentId: student2._id,
          courseId: course1._id,
          status: i % 2 === 0 ? 'Present' : 'Absent',
          markedAt: sessionDates[i],
        },
        {
          sessionId: sess1._id,
          studentId: student3._id,
          courseId: course1._id,
          status: 'Present',
          markedAt: sessionDates[i],
        },
      ]);

      // CS302 Session
      const sess2 = await AttendanceSession.create({
        courseId: course2._id,
        facultyId: faculty._id,
        date: sessionDates[i],
        topicOrSlot: topicsCS302[i],
      });

      await AttendanceRecord.create([
        {
          sessionId: sess2._id,
          studentId: student1._id,
          courseId: course2._id,
          status: i === 2 ? 'Late' : 'Present',
          markedAt: sessionDates[i],
        },
        {
          sessionId: sess2._id,
          studentId: student2._id,
          courseId: course2._id,
          status: i === 3 ? 'Present' : 'Absent', // Rahul: 1/4 = 25% -> Critical!
          markedAt: sessionDates[i],
        },
        {
          sessionId: sess2._id,
          studentId: student3._id,
          courseId: course2._id,
          status: 'Present',
          markedAt: sessionDates[i],
        },
      ]);
    }
    console.log('✅ Seeded 8 sessions with individual attendance records.');

    // 4. Create Assignments
    console.log('Seeding assignments...');
    await Assignment.create([
      {
        title: 'Assignment 1: AVL Tree Balance Rotation',
        description:
          'Implement left-rotation, right-rotation, and double rotations in C++/Java. Test with 1000 randomly generated keys.',
        courseId: course1._id,
        facultyId: faculty._id,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        submissions: [
          {
            studentId: student1._id,
            submissionTextOrUrl: 'https://github.com/vijay-sharma/avl-tree-implementation',
            contentOrLink: 'https://github.com/vijay-sharma/avl-tree-implementation',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            grade: 'A+',
            feedback: 'Excellent clean pointer manipulations and test coverage!',
          },
          {
            studentId: student3._id,
            submissionTextOrUrl: 'https://github.com/priyasingh/avl-tree-repo',
            contentOrLink: 'https://github.com/priyasingh/avl-tree-repo',
            submittedAt: new Date(),
          },
        ],
      },
      {
        title: 'Assignment 2: CPU Scheduling Simulator (Round Robin)',
        description:
          'Simulate Round Robin and Priority scheduling with simulated context switch overheads in Python or C.',
        courseId: course2._id,
        facultyId: faculty._id,
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        submissions: [
          {
            studentId: student1._id,
            submissionTextOrUrl: 'https://github.com/vijay-sharma/cpu-scheduler-sim',
            contentOrLink: 'https://github.com/vijay-sharma/cpu-scheduler-sim',
            submittedAt: new Date(),
          },
        ],
      },
    ]);
    console.log('✅ Seeded assignments.');

    // 5. Create Campus Events
    console.log('Seeding campus events...');
    await CampusEvent.create([
      {
        title: 'HackCampus 2026: 24h AI Hackathon',
        description:
          'Annual 24-hour hackathon focusing on generative AI, autonomous agents, and sustainability. Industry mentors and sponsor awards!',
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        venue: 'Auditorium Main Hall',
        clubName: 'Turing Coding Club',
        organizer: faculty._id,
        rsvps: [student1._id, student2._id, student3._id],
      },
      {
        title: 'Workshop: Modern Cloud & Container Orchestration',
        description:
          'Hands-on session building microservices with Docker, Kubernetes, and cloud deployment pipelines.',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        venue: 'Lab 305 (Cloud Computing Lab)',
        clubName: 'ACM Student Chapter',
        organizer: faculty._id,
        rsvps: [student1._id, student3._id],
      },
    ]);
    console.log('✅ Seeded campus events.');

    // 6. Create Grievances / Complaints
    console.log('Seeding grievances...');
    await Complaint.create([
      {
        title: 'Wi-Fi connectivity drop in Hostel Block C, 3rd Floor',
        description:
          'Access point AP-C-302 keeps dropping packets every 10 minutes during evening study hours.',
        category: 'Hostel',
        studentId: student1._id,
        status: 'In Progress',
        resolutionNotes: 'IT Network Team has scheduled access point firmware reset today.',
      },
      {
        title: 'Mess food quality inspection required in South Dining',
        description:
          'Requesting cleaner water filtration units and higher protein breakfast options.',
        category: 'Mess',
        studentId: student2._id,
        status: 'Pending',
      },
      {
        title: 'Air conditioner in Lab 204 leaking water',
        description:
          'Unit 2 creates water pools near computer row 4 posing an electrical hazard.',
        category: 'Maintenance',
        studentId: student3._id,
        status: 'Resolved',
        resolutionNotes: 'Technician repaired condensation pipe and tested cooling on 12-Oct.',
      },
    ]);
    console.log('✅ Seeded grievances.');

    // 7. Create Lost & Found
    console.log('Seeding lost & found...');
    await LostAndFound.create([
      {
        itemTitle: 'Blue HP 65W Laptop Charger',
        type: 'Lost',
        description:
          'Left near desk 18 in Central Library Reference Section on Tuesday afternoon.',
        location: 'Central Library 2nd Floor',
        contactInfo: 'vijay.sharma@campusone.edu / 9876543210',
        reportedBy: student1._id,
        isResolved: false,
      },
      {
        itemTitle: 'Casio Scientific Calculator fx-991EX',
        type: 'Found',
        description:
          'Found on teacher podium in Room 302 after the Operating Systems morning lecture.',
        location: 'Academic Block Room 302',
        contactInfo: 'faculty@campusone.edu or claim at Faculty Desk',
        reportedBy: faculty._id,
        isResolved: false,
      },
    ]);
    console.log('✅ Seeded lost & found items.');

    // 8. Create Room Bookings
    console.log('Seeding room bookings...');
    await RoomBooking.create([
      {
        roomNumber: 'Seminar Hall A',
        bookedBy: faculty._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeSlot: '10:00 AM - 12:00 PM',
        purpose: 'Guest Lecture on Distributed Consensus',
        status: 'Approved',
      },
      {
        roomNumber: 'Lab 201',
        bookedBy: student1._id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        timeSlot: '02:00 PM - 04:00 PM',
        purpose: 'Turing Coding Club Practice Contest',
        status: 'Approved',
      },
      {
        roomNumber: 'Conference Room 2',
        bookedBy: student2._id,
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        timeSlot: '04:00 PM - 05:30 PM',
        purpose: 'Student Council Grievance Review Meeting',
        status: 'Pending',
      },
    ]);
    console.log('✅ Seeded room bookings.');

    console.log('====================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('Ready-to-test Demo Accounts:');
    console.log('  Admin:   admin@campusone.edu   / Admin@123');
    console.log('  Faculty: faculty@campusone.edu / Faculty@123 (Dr. Alan Turing)');
    console.log('  Student: student@campusone.edu / Student@123 (Vijay Sharma - 100% attendance)');
    console.log('  Student: rahul@campusone.edu   / Student@123 (Rahul Verma - 37% attendance [Warning])');
    console.log('  Student: priya@campusone.edu   / Student@123 (Priya Singh - 100% attendance)');
    console.log('====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
