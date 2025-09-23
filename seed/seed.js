const mongoose = require('mongoose');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const Subject = require('../src/models/Subject');
const Result = require('../src/models/Result');
const Attendance = require('../src/models/Attendance');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Clear existing data
        await User.deleteMany({});
        await Class.deleteMany({});
        await Subject.deleteMany({});
        await Result.deleteMany({});
        await Attendance.deleteMany({});

        // Seed Users
        const users = [
            { name: 'John Doe', email: 'john@example.com', password: 'password123' },
            { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' },
        ];
        await User.insertMany(users);

        // Seed Classes
        const classes = [
            { name: 'Mathematics', teacher: 'John Doe' },
            { name: 'Science', teacher: 'Jane Smith' },
        ];
        await Class.insertMany(classes);

        // Seed Subjects
        const subjects = [
            { name: 'Algebra', class: 'Mathematics' },
            { name: 'Biology', class: 'Science' },
        ];
        await Subject.insertMany(subjects);

        // Seed Results
        const results = [
            { userId: '1', subjectId: '1', score: 95 },
            { userId: '2', subjectId: '2', score: 88 },
        ];
        await Result.insertMany(results);

        // Seed Attendance
        const attendanceRecords = [
            { userId: '1', date: new Date(), status: 'Present' },
            { userId: '2', date: new Date(), status: 'Absent' },
        ];
        await Attendance.insertMany(attendanceRecords);

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDatabase();