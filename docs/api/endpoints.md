# API Endpoints

Base URL: `/api/v1`

Authentication: Bearer Token (Firebase ID Token)

## User Profile

### Onboard User
Completes the user registration process by creating a profile and optionally joining/creating an organization.

- **URL**: `/users/onboard`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
    - `photo` (File, Optional): Profile picture image.
    - `email` (String, Required): User email.
    - `displayName` (String, Required): Full name.
    - `writingStyle` (String, Optional): Preferred writing style.
    - `createOrganization` (Boolean, Optional): Create a new org?
    - `organizationName` (String, Optional): Name of org if creating one.
    - `...` (Other profile fields)

### Get Current Profile
Retrieve the profile of the currently authenticated user.

- **URL**: `/users/me`
- **Method**: `GET`
- **Success Response**: `200 OK` with User object.

### Update Profile
Update details of the current user.

- **URL**: `/users/me`
- **Method**: `PATCH`
- **Body Parameters**: (JSON)
    - Any writable User schema field (e.g., `bio`, `displayName`, `preferences`).

### Get User by ID
Fetch a user's public profile details.

- **URL**: `/users/:id`
- **Method**: `GET`

### List Users (Admin)
Get a list of all users, optionally filtered.

- **URL**: `/users`
- **Method**: `GET`
- **Query Params**:
    - `role` (optional): Filter by role.
    - `status` (optional): Filter by status.

### Deactivate User
Soft delete a user account (Self or Admin).

- **URL**: `/users/:id/deactivate`
- **Method**: `PATCH`

### Disable/Activate User (Admin)
Ban or unban a user.

- **URL**: `/users/:id/disable` or `/users/:id/activate`
- **Method**: `PATCH`
