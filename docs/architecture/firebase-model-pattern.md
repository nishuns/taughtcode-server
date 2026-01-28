# Firebase Model Architecture

This document outlines the **Firebase Model Pattern** used in this project to interact with Firestore. This abstraction layer provides a structured, familiar, and type-safe way to manage data, mimicking the popular **Mongoose** library used with MongoDB.

## Concept

Directly using the Firestore SDK in Controllers or Services can lead to code duplication, scattered validation logic, and a lack of type safety. The `FirebaseModel` class acts as a base wrapper that provides standard CRUD operations (`create`, `findById`, `update`, `delete`) and integrates schema validation using **Joi**.

## Architecture Components

1.  **FirebaseModel (Base Class)**: Located in `src/utils/firebaseModel.js`. It wraps the Firestore collection and implements generic CRUD methods.
2.  **Concrete Models**: Classes that extend `FirebaseModel` (e.g., `src/models/userProfileModel.js`). They define the collection name and can add specific business queries.
3.  **Validation Schemas**: Joi schemas (e.g., `src/validation/`) that define the structure and constraints of the data.
4.  **Utilities**: Helper functions in `src/utils/firebaseUtils.js` for data transformation (e.g., converting Firestore timestamps).

---

## Comparison: FirebaseModel vs. Mongoose

While designed to feel like Mongoose, there are fundamental differences due to the underlying database (NoSQL Document Store vs. NoSQL Document Store).

| Feature | Mongoose (MongoDB) | FirebaseModel (Firestore) |
| :--- | :--- | :--- |
| **Connection** | Maintains a persistent TCP connection pool. | Stateless HTTP/gRPC (via SDK). |
| **Schemas** | Strict schemas defined in Mongoose. | **Joi** schemas applied at the application layer. |
| **Queries** | Rich query language (`$gt`, `$in`, regex). | Limited Firestore queries (equality, basic range). |
| **Relations** | `populate()` for joining collections. | No native joins. Manual fetching required. |
| **Middleware** | Pre/Post hooks (`pre('save')`). | Not implemented (could be added). |
| **ID** | `_id` (ObjectId). | `id` (String/UUID). |

---

## Usage Guide

### 1. Direct Instantiation (Simplified Style)

For simple collections where you don't need custom methods, you can instantiate `FirebaseModel` directly. This is cleaner and easier to read.

```javascript
import { createModel } from '../models/index.js';
import Joi from 'joi';

const categorySchema = Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().required()
});

// Create model instance directly
const Category = createModel('categories', categorySchema);

// Usage
await Category.create({ name: 'Tech', slug: 'tech' });
const allCategories = await Category.find();
```

### 2. Class Extension (Advanced Style)

For models requiring custom business logic or complex queries, extend the class.

```javascript
// src/models/productModel.js
import FirebaseModel from '../utils/firebaseModel.js';
import Joi from 'joi';

const productSchema = Joi.object({
// ...


## Implementation Details

### `src/utils/firebaseModel.js`

-   **`constructor(collectionName, schema)`**: Initializes the Firestore collection reference.
-   **`create(data)`**: Validates input, adds timestamps (`createdAt`, `updatedAt`), and saves to a new document.
-   **`findById(id)`**: Fetches a document and converts it to a plain object using `docToObj`.
-   **`find(filters)`**: Performs basic equality queries.
-   **`update(id, data)`**: Updates specific fields and refreshes `updatedAt`.
-   **`delete(id)`**: Removes the document.

### `src/utils/firebaseUtils.js`

-   **`docToObj(doc)`**: Converts a Firestore `DocumentSnapshot` to a plain JS object. Crucially, it converts Firestore `Timestamp` objects back to standard JS `Date` objects for ease of use in the frontend/API.

## Why this approach?

1.  **Consistency**: Developers coming from a MERN stack feel right at home.
2.  **Safety**: Joi validation prevents "schemaless chaos" in the database.
3.  **Abstraction**: If we ever switch database providers, we only update the `FirebaseModel` base class, not every service.
