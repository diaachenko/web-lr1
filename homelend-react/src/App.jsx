import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

import './styles/style.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import Bookings from './pages/Bookings';
import Contacts from './pages/Contacts';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [suites, setSuites] = useState([]);
  const [bookedSuites, setBookedSuites] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().bookings) {
            setBookedSuites(userDoc.data().bookings);
          } else {
            setBookedSuites({});
          }
        } catch (error) {
          console.error("Помилка завантаження бронювань користувача:", error);
        }
      } else {
        setBookedSuites({});
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSuites = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "apartments"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSuites(data);
      } catch (err) { console.error("Firebase fetch error:", err); }
    };
    fetchSuites();
  }, []);

  const seedDatabase = async () => {
    try {
      const res = await fetch('/suites.json');
      const data = await res.json();
      for (const item of data) await setDoc(doc(db, "apartments", item.id), item);
      alert("Дані завантажені! Оновіть сторінку (F5).");
    } catch (err) { console.error(err); }
  };

  const toggleBooking = async (suiteId) => {
    if (!user) {
      alert("Please login to book a suite!");
      return;
    }

    const updatedBookings = { ...bookedSuites };
    if (updatedBookings[suiteId]) {
      delete updatedBookings[suiteId];
    } else {
      updatedBookings[suiteId] = true;
    }

    setBookedSuites(updatedBookings);

    try {
      await setDoc(doc(db, "users", user.uid), { bookings: updatedBookings }, { merge: true });
    } catch (error) {
      console.error("Помилка збереження бронювання у Firebase:", error);
    }
  };

  return (
    <>
      <div id="top"></div>
      <Header user={user} />
      {suites.length === 0 && (
         <button onClick={seedDatabase} style={{display: 'block', margin: '100px auto'}}>
           Завантажити JSON у Firebase
         </button>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search suites={suites} bookedSuites={bookedSuites} toggleBooking={toggleBooking} user={user} />} />
        
        {/* Захищений маршрут: сюди потраплять тільки залогінені користувачі */}
        <Route path="/bookings" element={
          <ProtectedRoute user={user}>
            <Bookings suites={suites} bookedSuites={bookedSuites} toggleBooking={toggleBooking} user={user} />
          </ProtectedRoute>
        } />
        
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
      <Footer />
    </>
  );
}