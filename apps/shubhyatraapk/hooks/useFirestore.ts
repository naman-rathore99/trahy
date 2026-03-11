import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";

export function useCollection(collectionName: string, condition?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    try {
      const ref = collection(db, collectionName);
      
      // Optional: Logic to handle filtering if 'condition' is passed
      const q = condition 
        ? query(ref, where(condition.field, "==", condition.value)) 
        : ref; 

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const results: any[] = [];
        snapshot.docs.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
        
        setData(results);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe(); 

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName]);

  return { data, loading, error };
}