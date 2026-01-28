import { db } from '../config/firebase.js';
import { docToObj, buildQuery } from './firebaseUtils.js';

/**
 * Base Model class for Firestore collections
 * mimic Mongoose-like behavior for consistency
 */
class FirebaseModel {
    /**
     * @param {string} collectionName - Name of the Firestore collection
     * @param {Object} schema - Joi schema for validation (optional)
     */
    constructor(collectionName, schema = null) {
        this.collectionName = collectionName;
        this.collection = db.collection(collectionName);
        this.schema = schema;
    }

    /**
     * Validate data against the schema
     * @param {Object} data 
     * @returns {Object} Validated data
     */
    validate(data) {
        if (!this.schema) return data;
        const { error, value } = this.schema.validate(data, { stripUnknown: true });
        if (error) {
            throw new Error(`Validation Error in ${this.collectionName}: ${error.details[0].message}`);
        }
        return value;
    }

    /**
     * Create a new document
     * @param {Object} data 
     * @returns {Promise<Object>} Created document
     */
    async create(data) {
        const timestamp = new Date();
        const docData = {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const validatedData = this.validate(docData);

        // Allow custom ID if provided, otherwise auto-generate
        const docRef = validatedData.id 
            ? this.collection.doc(validatedData.id) 
            : this.collection.doc();
            
        // Remove ID from data if it was used for the docRef to avoid duplication, 
        // or keep it if you want it in the body. Firestore doesn't require id in body.
        delete validatedData.id;

        await docRef.set(validatedData);
        
        return { id: docRef.id, ...validatedData };
    }

    /**
     * Find a document by ID
     * @param {string} id 
     * @returns {Promise<Object|null>} Document object or null
     */
    async findById(id) {
        const doc = await this.collection.doc(id).get();
        return docToObj(doc);
    }

    /**
     * Find documents based on query filters
     * @param {Object} filters - Key-value pairs for equality matching
     * @returns {Promise<Array>} Array of documents
     */
    async find(filters = {}) {
        const query = buildQuery(this.collection, filters);
        const snapshot = await query.get();
        return snapshot.docs.map(doc => docToObj(doc));
    }

    /**
     * Find a single document matching filters
     * @param {Object} filters 
     * @returns {Promise<Object|null>}
     */
    async findOne(filters = {}) {
        const query = buildQuery(this.collection, filters).limit(1);
        const snapshot = await query.get();
        if (snapshot.empty) return null;
        return docToObj(snapshot.docs[0]);
    }

    /**
     * Update a document by ID
     * @param {string} id 
     * @param {Object} data 
     * @returns {Promise<Object>} Updated document
     */
    async update(id, data) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            throw new Error(`${this.collectionName} not found with id: ${id}`);
        }

        const updates = {
            ...data,
            updatedAt: new Date()
        };
        
        // Note: Partial validation could be complex depending on schema strictness.
        // For strict schemas, you might need to merge with existing data and validate.
        
        await docRef.update(updates);
        return { id, ...(doc.data()), ...updates };
    }

    /**
     * Delete a document by ID
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        await this.collection.doc(id).delete();
        return true;
    }
}

export default FirebaseModel;
