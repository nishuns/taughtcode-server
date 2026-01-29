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
        required: true,
        trim: true
    },
    photoURL: {
        type: String,
        trim: true
    },
    occupation: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: 1000,
        trim: true
    },
    hobbies: {
        type: Array,
        default: []
    },
    interests: {
        type: Array,
        default: []
    },
    expertise: {
        type: Array,
        default: [] // Areas the user is knowledgeable in
    },
    writingStyle: {
        type: String,
        enum: ['professional', 'casual', 'technical', 'witty', 'academic', 'storyteller'],
        default: 'casual'
    },
    socialLinks: {
        type: Object,
        default: {
            twitter: '',
            linkedin: '',
            github: '',
            website: ''
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    preferences: {
        type: Object,
        default: {
            theme: 'dark',
            notifications: true,
            language: 'en'
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
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
