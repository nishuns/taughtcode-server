import FirebaseModel from '../utils/firebaseModel.js';
import { userProfileSchema } from '../validation/userProfileValidation.js';

class UserProfileModel extends FirebaseModel {
    constructor() {
        super('users', userProfileSchema);
    }

    /**
     * Find user by email (Custom method example)
     * @param {string} email 
     */
    async findByEmail(email) {
        return this.findOne({ email });
    }
}

export default new UserProfileModel();
