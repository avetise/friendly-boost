import { db } from './firebase';

import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

import { useAuth } from '@/contexts/AuthContext';
// Add this interface before the fetchActiveUsers function
interface UserActivityData {
    documentCount: number;
    lastActive: string;
}

export async function fetchUsers() {
    const { user } = useAuth();
    try {
        // Add these debug logs
        console.log("Current user:", user);
        console.log("Current user email:", user.email);
        console.log("Is user authenticated:", !!user);

        const coverLettersRef = collection(db, 'coverletters');
        const coverLettersSnapshot = await getDocs(coverLettersRef);
        
        // ... rest of your existing code ...
    } catch (e) {
        console.error("Error fetching active users: ", e);
        console.error("Error details:", e.message, e.code);  // Add more error details
        throw e;
    }

    try {
        const userCollectionRef = collection(db, 'users');
        const userCollection = await getDocs(userCollectionRef);
        return userCollection.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (e) {
        console.error("Error fetching users: ", e);
        throw e; // rethrow the error after logging it
    }
}

export async function updateUser(userId, updatedData) {
    try {
        // Prepare the data to update, filtering out any undefined values.
        const dataToUpdate = Object.fromEntries(
            Object.entries(updatedData).filter(([_, value]) => value !== undefined)
        );

        // If there is no valid data to update, exit early.
        if (Object.keys(dataToUpdate).length === 0) return;

        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, dataToUpdate);
    } catch (e) {
        console.error("Error updating user: ", e);
        throw e; // rethrow the error after logging it
    }
}


// firestoreService.js
export async function fetchActiveUsers() {
    try {
        const coverLettersRef = collection(db, 'coverletters');
        const coverLettersSnapshot = await getDocs(coverLettersRef);

        // Aggregate data to count documents per user and track unique users
        const userActivity: Record<string, UserActivityData> = {};
        coverLettersSnapshot.docs.forEach(doc => {
            const userEmail = doc.data().email;
            const createdAt = doc.data().createdAt.toDate().toISOString(); // Assuming createdAt is stored in the document

            if (userEmail) {
                if (!userActivity[userEmail]) {
                    userActivity[userEmail] = { documentCount: 0, lastActive: createdAt };
                }else{
                    userActivity[userEmail].documentCount += 1;

                    // Update lastActive if the current doc is more recent
                    if (createdAt > userActivity[userEmail].lastActive) {
                        userActivity[userEmail].lastActive = createdAt;
                    }
                }

                
            }
        });

        // Calculate total unique users
        const totalUniqueUsers = Object.keys(userActivity).length;

        // Convert the object to an array and sort by document count
        const activeUsers = Object.entries(userActivity)
        .map(([email, { documentCount, lastActive }]) => ({ email, documentCount, lastActive }))
        .sort((a, b) => b.documentCount - a.documentCount)
            .slice(0, 20); // Assuming you want the top 10 active users

        return { activeUsers, totalUniqueUsers };
    } catch (e) {
        console.error("Error fetching active users: ", e);
        throw e; // rethrow the error after logging it
    }
}