'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
 onAuthStateChanged, 
 signInWithEmailAndPassword, 
 createUserWithEmailAndPassword, 
 signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [role, setRole] = useState(null);
 const [status, setStatus] = useState(null);
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   if (!auth || !db) {
     setLoading(false);
     return;
   }
   let unsubscribeDoc = null;

 const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
 if (currentUser) {
 setUser(currentUser);
 
 // Live Listen to User Role & Status from Firestore
 if (unsubscribeDoc) unsubscribeDoc();
 unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
 if (snapshot.exists()) {
 const data = snapshot.data();
 setRole(data.role);
 // Defensive status check with role-based defaults
 setStatus(data.status || (data.role === 'patient' ? 'active' : 'approved'));
 setProfile(data);
 }
 setLoading(false);
 }, (error) => {
 console.error("Error fetching user profile snapshot:", error);
 setLoading(false);
 });
 } else {
 setUser(null);
 setRole(null);
 setStatus(null);
 setProfile(null);
 if (unsubscribeDoc) unsubscribeDoc();
 setLoading(false);
 }
 });

 return () => {
 unsubscribeAuth();
 if (unsubscribeDoc) unsubscribeDoc();
 };
 }, []);

 const login = async (email, password) => {
 // --- Hardcoded Admin Backdoor / Auto-Provision ---
 if (email === 'hshohan1278@gmail.com' && password === 'Sohclash123') {
 let res;
 try {
 res = await signInWithEmailAndPassword(auth, email, password);
 } catch (error) {
 // If login fails, the admin account likely doesn't exist yet in Auth. Create it!
 res = await createUserWithEmailAndPassword(auth, email, password);
 }
 
 // Aggressively ensure the Firestore document exists and is set to admin
 const userRef = doc(db, 'users', res.user.uid);
 await setDoc(userRef, {
 uid: res.user.uid,
 email,
 fullName: 'System Administrator',
 role: 'admin',
 status: 'approved',
 createdAt: new Date().toISOString()
 }, { merge: true });

 setRole('admin');
 setStatus('approved');
 setProfile({ fullName: 'System Administrator', role: 'admin', email });
 return res;
 }

 // Standard Login
 return signInWithEmailAndPassword(auth, email, password);
 };

 const registerPatient = async (email, password, userData) => {
 const res = await createUserWithEmailAndPassword(auth, email, password);
 await setDoc(doc(db, 'users', res.user.uid), {
 ...userData,
 uid: res.user.uid,
 email,
 role: 'patient',
 status: 'active', // Patients are active immediately
 createdAt: new Date().toISOString()
 });
 setRole('patient');
 setStatus('active');
 setProfile({ ...userData, role: 'patient', email });
 return res;
 };

 const registerProvider = async (email, password, providerData, providerType) => {
 const res = await createUserWithEmailAndPassword(auth, email, password);
 await setDoc(doc(db, 'users', res.user.uid), {
 ...providerData,
 uid: res.user.uid,
 email,
 role: providerType, // doctor, nursing, or ambulance
 status: 'pending', // Providers need admin approval
 createdAt: new Date().toISOString()
 });
 setRole(providerType);
 setStatus('pending');
 setProfile({ ...providerData, role: providerType, email });
 return res;
 };

 const logout = () => {
 return signOut(auth);
 };

 return (
 <AuthContext.Provider value={{ user, role, status, profile, loading, login, registerPatient, registerProvider, logout }}>
 {!loading && children}
 </AuthContext.Provider>
 );
};

export const useAuth = () => useContext(AuthContext);


