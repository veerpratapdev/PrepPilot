import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    subject: "",
    topic: "",
    minutes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const user = auth.currentUser;

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setSessions(data.studySessions || []);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  const saveSessionsToFirestore = async (updatedSessions) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      await setDoc(
        userDocRef,
        {
          studySessions: updatedSessions,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving sessions:", error);
      alert("Failed to save study session");
    }
  };

  const updateSessions = async (updatedSessions) => {
    setSessions(updatedSessions);
    await saveSessionsToFirestore(updatedSessions);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject || !form.topic || !form.minutes || !form.date) {
      alert("Please fill all fields");
      return;
    }

    const newSession = {
      id: Date.now(),
      subject: form.subject,
      topic: form.topic,
      minutes: Number(form.minutes),
      date: form.date,
    };

    const updatedSessions = [newSession, ...sessions];

    await updateSessions(updatedSessions);

    setForm({
      subject: "",
      topic: "",
      minutes: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const deleteSession = async (id) => {
    const filteredSessions = sessions.filter((item) => item.id !== id);
    await updateSessions(filteredSessions);
  };

  const totalMinutes = sessions.reduce(
    (total, item) => total + Number(item.minutes || 0),
    0
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />

        <main className="p-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-cyan-400">
            Loading Study Sessions...
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Study <span className="text-cyan-400">Sessions</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 p-6 rounded-2xl grid md:grid-cols-4 gap-4 mb-8"
        >
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-cyan-400"
          />

          <input
            type="text"
            name="topic"
            placeholder="Topic"
            value={form.topic}
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-cyan-400"
          />

          <input
            type="number"
            name="minutes"
            placeholder="Minutes"
            value={form.minutes}
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-cyan-400"
          />

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-cyan-400"
          />

          <button className="md:col-span-4 bg-cyan-500 text-slate-950 font-bold py-3 rounded-lg hover:bg-cyan-400">
            Save Session
          </button>
        </form>

        <div className="bg-slate-800 p-6 rounded-2xl mb-8">
          <h2 className="text-slate-300">Total Study Time</h2>

          <p className="text-4xl font-bold text-cyan-400 mt-3">
            {totalHours}h {remainingMinutes}m
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            Session History
          </h2>

          {sessions.length === 0 ? (
            <p className="text-slate-300">No study sessions yet.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-700 p-4 rounded-xl flex justify-between items-center bg-slate-900"
                >
                  <div>
                    <h3 className="font-bold text-lg">{item.subject}</h3>

                    <p className="text-slate-300">{item.topic}</p>

                    <p className="text-sm text-slate-400">
                      {item.minutes} minutes • {item.date}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteSession(item.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudySessions;