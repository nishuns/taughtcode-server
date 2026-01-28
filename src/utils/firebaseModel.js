import Joi from 'joi';
import { db } from '../config/firebase.js';
import { docToObj, buildQuery } from './firebaseUtils.js';

/**
 * Convert Mongoose-style schema object to Joi schema
 * @param {Object} schemaObj 
 * @returns {Object} Joi Schema
 */
const convertToJoi = (schemaObj) => {
    if (!schemaObj) return null;
    if (schemaObj.isJoi) return schemaObj; // Already a Joi schema

    const joiDefinition = {};

    for (const [key, config] of Object.entries(schemaObj)) {
        let field;
        const type = config.type || config; // Handle shorthand { name: String }

        // Resolve Type
        if (type === String) field = Joi.string().allow('', null);
        else if (type === Number) field = Joi.number();
        else if (type === Boolean) field = Joi.boolean();
        else if (type === Date) field = Joi.date();
        else if (type === Array) field = Joi.array();
        else if (type === Object) field = Joi.object();
        else if (typeof type === 'object' && !Array.isArray(type)) {
            // Recursive for nested objects
            field = convertToJoi(type);
        }
        else field = Joi.any();

        // Apply Constraints
        if (config.required) field = field.required();
        if (config.trim && field.trim) field = field.trim();
        if (config.lowercase && field.lowercase) field = field.lowercase();
        if (config.uppercase && field.uppercase) field = field.uppercase();
        if (config.enum) field = field.valid(...config.enum);
        if (config.minlength) field = field.min(config.minlength);
        if (config.maxlength) field = field.max(config.maxlength);
        if (config.min !== undefined) field = field.min(config.min);
        if (config.max !== undefined) field = field.max(config.max);
        
        // Handle Default Values
        if (config.default !== undefined) {
            // Joi default() accepts values or functions
            field = field.default(config.default);
        }

        joiDefinition[key] = field;
    }

    return Joi.object(joiDefinition);
};

/**
 * Base Model class for Firestore collections
 * mimic Mongoose-like behavior for consistency
 */
class FirebaseModel {
    /**
     * @param {string} collectionName - Name of the Firestore collection
     * @param {Object} schema - Joi schema or Mongoose-style object
     */
    constructor(collectionName, schema = null) {
        this.collectionName = collectionName;
        this.collection = db.collection(collectionName);
        this.schema = convertToJoi(schema);
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
