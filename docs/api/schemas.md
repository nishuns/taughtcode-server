# Data Schemas

## User Profile

The User Profile represents a registered user in the system.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `uid` | String | Yes | Unique Firebase Auth ID. |
| `email` | String | Yes | User's email address. |
| `displayName` | String | Yes | User's full name or display name. |
| `photoURL` | String | No | URL to the profile picture. |
| `occupation` | String | No | User's job title or occupation. |
| `bio` | String | No | Short biography (max 1000 chars). |
| `hobbies` | Array | No | List of hobbies. |
| `interests` | Array | No | List of interests. |
| `expertise` | Array | No | Areas of expertise. |
| `writingStyle` | String | No | Preferred AI writing style (e.g., 'casual', 'professional'). |
| `organizationId` | String | No | ID of the organization the user belongs to. |
| `role` | String | Yes | User role (`user`, `admin`, `moderator`). Default: `user`. |
| `status` | String | Yes | Account status (`active`, `deactivated`, `disabled`). Default: `active`. |
| `preferences` | Object | No | UI preferences (theme, notifications). |
| `socialLinks` | Object | No | Social media profile links. |
| `createdAt` | Date | Yes | Timestamp of creation. |
| `updatedAt` | Date | Yes | Timestamp of last update. |

## Organization

Represents a workspace or team.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes | Unique Organization ID. |
| `name` | String | Yes | Organization name. |
| `orgCode` | String | No | Unique code for the organization. |
| `slug` | String | No | URL-friendly slug. |
| `type` | String | Yes | Type (`enterprise`, `startup`, `personal`). |
| `ownerId` | String | Yes | User ID of the admin. |
| `description` | String | No | Description of the organization. |
| `settings` | Object | No | Organization settings (api keys, user limits). |
| `status` | Object | No | Status object containing state and history. |
