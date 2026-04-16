import { db } from './src/lib/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

const seedData = async () => {
  try {
    // 1. Add Providers
    const providers = [
      {
        name: "Labaid Dhanmondi",
        division: "Dhaka",
        district: "Dhaka",
        area: "Dhanmondi",
        status: "active",
        createdAt: new Date()
      },
      {
        name: "Popular Diagnostic Center",
        division: "Dhaka",
        district: "Dhaka",
        area: "Dhanmondi",
        status: "active",
        createdAt: new Date()
      },
      {
        name: "Ibn Sina Uttara",
        division: "Dhaka",
        district: "Dhaka",
        area: "Uttara",
        status: "active",
        createdAt: new Date()
      }
    ];

    console.log("Seeding Lab Providers...");
    for (const p of providers) {
      const pRef = await addDoc(collection(db, 'lab_providers'), p);
      
      // 2. Add Tests for each provider
      const tests = [
        {
          name: "Complete Blood Count (CBC)",
          category: "Blood Test",
          price: 450,
          preparation: "8-12 hours fasting required",
          description: "A complete blood count (CBC) is a blood test used to evaluate your overall health.",
          providerId: pRef.id,
          status: "active"
        },
        {
          name: "Lipid Profile",
          category: "Biochemistry",
          price: 1200,
          preparation: "12 hours fasting required",
          description: "Measures cholesterol and triglycerides in the blood.",
          providerId: pRef.id,
          status: "active"
        },
        {
          name: "HBA1C",
          category: "Diabetes",
          price: 950,
          preparation: "No fasting required",
          description: "Measures average blood sugar levels over the past 3 months.",
          providerId: pRef.id,
          status: "active"
        }
      ];

      for (const t of tests) {
        await addDoc(collection(db, 'lab_tests'), t);
      }
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

seedData();
