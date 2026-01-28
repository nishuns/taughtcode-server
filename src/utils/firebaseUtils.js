import { db } from '../config/firebase.js';

/**
 * Convert Firestore document to a plain JavaScript object
 * Handles serialization of Timestamps and other Firestore types
 * @param {Object} doc - Firestore document snapshot
 * @returns {Object} Plain object with id and data
 */
export const docToObj = (doc) => {
    if (!doc.exists) return null;
    const data = doc.data();
    
    // Handle Dates/Timestamps if necessary (recursive function could be added here)
    // For now, we return the data as is with the ID
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
    };
};

/**
 * Generate a query based on filters
 * @param {CollectionReference} collectionRef 
 * @param {Object} filters 
 * @returns {Query}
 */
export const buildQuery = (collectionRef, filters = {}) => {
    let query = collectionRef;

    Object.entries(filters).forEach(([key, value]) => {
        // Simple equality check for now, can be expanded for >, <, array-contains etc.
        if (value !== undefined && value !== null) {
            query = query.where(key, '==', value);
        }
    });

    return query;
};
