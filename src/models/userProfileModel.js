import FirebaseModel from '../utils/firebaseModel.js';

/**
 * User Profile Schema Definition (Mongoose-style)
 */
const userProfileSchema = {
    uid: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    displayName: {
        type: String,
        trim: true
    },
    photoURL: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    preferences: {
        type: Object,
        default: {
            theme: 'light',
            notifications: true
        }
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    updatedAt: {
        type: Date,
        default: () => new Date()
    }
};

// Instantiate directly (No class extension)
const User = new FirebaseModel('users', userProfileSchema);

/**
 * Custom Method: Find user by email
 * Attaching directly to the instance
 */
User.findByEmail = async function(email) {
    return this.findOne({ email });
};

export default User;
