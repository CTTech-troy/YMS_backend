export const validateUserRegistration = (data) => {
    const { username, email, password } = data;
    const errors = {};

    if (!username || username.trim() === '') {
        errors.username = 'Username is required';
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Valid email is required';
    }

    if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateUserLogin = (data) => {
    const { email, password } = data;
    const errors = {};

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Valid email is required';
    }

    if (!password) {
        errors.password = 'Password is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateClassData = (data) => {
    const { name, teacherId } = data;
    const errors = {};

    if (!name || name.trim() === '') {
        errors.name = 'Class name is required';
    }

    if (!teacherId) {
        errors.teacherId = 'Teacher ID is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateSubjectData = (data) => {
    const { title, classId } = data;
    const errors = {};

    if (!title || title.trim() === '') {
        errors.title = 'Subject title is required';
    }

    if (!classId) {
        errors.classId = 'Class ID is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};