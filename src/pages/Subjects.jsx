import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

function Subjects() {
  const [subjectName, setSubjectName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [topicInputs, setTopicInputs] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const loadSubjects = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setSubjects(data.subjects || []);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [user]);

  const saveSubjectsToFirestore = async (updatedSubjects) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      await setDoc(
        userDocRef,
        {
          subjects: updatedSubjects,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving subjects:", error);
      alert("Failed to save data");
    }
  };

  const updateSubjects = async (updatedSubjects) => {
    setSubjects(updatedSubjects);
    await saveSubjectsToFirestore(updatedSubjects);
  };

  const addSubject = async () => {
    if (!subjectName.trim() || !examDate) {
      alert("Please enter subject name and exam date");
      return;
    }

    const newSubject = {
      id: Date.now(),
      name: subjectName,
      examDate,
      topics: [],
    };

    const updatedSubjects = [...subjects, newSubject];

    await updateSubjects(updatedSubjects);

    setSubjectName("");
    setExamDate("");
  };

  const deleteSubject = async (id) => {
    const updatedSubjects = subjects.filter(
      (subject) => subject.id !== id
    );

    await updateSubjects(updatedSubjects);
  };

  const handleTopicInput = (subjectId, value) => {
    setTopicInputs((prev) => ({
      ...prev,
      [subjectId]: value,
    }));
  };

  const addTopic = async (subjectId) => {
    const topicTitle = topicInputs[subjectId];

    if (!topicTitle || !topicTitle.trim()) {
      alert("Please enter topic name");
      return;
    }

    const updatedSubjects = subjects.map((subject) =>
      subject.id === subjectId
        ? {
            ...subject,
            topics: [
              ...(subject.topics || []),
              {
                id: Date.now(),
                title: topicTitle,
                completed: false,
              },
            ],
          }
        : subject
    );

    await updateSubjects(updatedSubjects);

    setTopicInputs((prev) => ({
      ...prev,
      [subjectId]: "",
    }));
  };

  const toggleTopic = async (subjectId, topicId) => {
    const updatedSubjects = subjects.map((subject) =>
      subject.id === subjectId
        ? {
            ...subject,
            topics: (subject.topics || []).map((topic) =>
              topic.id === topicId
                ? { ...topic, completed: !topic.completed }
                : topic
            ),
          }
        : subject
    );

    await updateSubjects(updatedSubjects);
  };

  const deleteTopic = async (subjectId, topicId) => {
    const updatedSubjects = subjects.map((subject) =>
      subject.id === subjectId
        ? {
            ...subject,
            topics: (subject.topics || []).filter(
              (topic) => topic.id !== topicId
            ),
          }
        : subject
    );

    await updateSubjects(updatedSubjects);
  };

  const getDaysLeft = (examDate) => {
    const today = new Date();
    const exam = new Date(examDate);

    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);

    const timeDiff = exam - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <div className="p-8 text-cyan-400 text-xl">
          Loading subjects...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <main className="p-8">
        <h1 className="text-4xl font-bold mb-6 text-cyan-400">
          My Subjects
        </h1>

        <div className="bg-slate-800 p-6 rounded-2xl max-w-xl mb-8">
          <input
            type="text"
            placeholder="Enter subject name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-slate-700 outline-none"
          />

          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-slate-700 outline-none"
          />

          <button
            onClick={addSubject}
            className="w-full bg-cyan-400 text-slate-950 py-3 rounded-lg font-semibold hover:bg-cyan-300"
          >
            Add Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-slate-800 p-6 rounded-2xl max-w-xl">
            <h2 className="text-2xl font-bold">No subjects yet</h2>
            <p className="text-slate-300 mt-2">
              Add your first subject to start planning.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const totalTopics = (subject.topics || []).length;

              const completedTopics = (subject.topics || []).filter(
                (topic) => topic.completed
              ).length;

              const progress =
                totalTopics === 0
                  ? 0
                  : Math.round((completedTopics / totalTopics) * 100);

              const daysLeft = getDaysLeft(subject.examDate);

              return (
                <div
                  key={subject.id}
                  className="bg-slate-800 p-6 rounded-2xl"
                >
                  <h2 className="text-2xl font-bold text-cyan-400">
                    {subject.name}
                  </h2>

                  <p className="text-slate-300 mt-2">
                    📅 Exam Date: {subject.examDate}
                  </p>

                  <p className="text-slate-300 mt-2">
                    ⏳ Days Left:{" "}
                    {daysLeft > 0
                      ? `${daysLeft} days`
                      : daysLeft === 0
                      ? "Today"
                      : "Exam passed"}
                  </p>

                  <p className="text-slate-300 mt-2">
                    ✅ {completedTopics}/{totalTopics} Topics Completed
                  </p>

                  <ProgressBar progress={progress} />

                  <div className="mt-5">
                    <input
                      type="text"
                      placeholder="Enter topic name"
                      value={topicInputs[subject.id] || ""}
                      onChange={(e) =>
                        handleTopicInput(subject.id, e.target.value)
                      }
                      className="w-full mb-3 px-4 py-2 rounded-lg bg-slate-700 outline-none"
                    />

                    <button
                      onClick={() => addTopic(subject.id)}
                      className="w-full bg-cyan-400 text-slate-950 py-2 rounded-lg font-semibold hover:bg-cyan-300"
                    >
                      Add Topic
                    </button>
                  </div>

                  <div className="mt-5">
                    <h3 className="font-bold mb-3">Topics:</h3>

                    {(subject.topics || []).length === 0 ? (
                      <p className="text-slate-400">No topics added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {(subject.topics || []).map((topic) => (
                          <div
                            key={topic.id}
                            className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded-lg"
                          >
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={topic.completed}
                                onChange={() =>
                                  toggleTopic(subject.id, topic.id)
                                }
                              />

                              <span
                                className={
                                  topic.completed
                                    ? "line-through text-slate-400"
                                    : ""
                                }
                              >
                                {topic.title}
                              </span>
                            </label>

                            <button
                              onClick={() =>
                                deleteTopic(subject.id, topic.id)
                              }
                              className="text-red-400 font-bold"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteSubject(subject.id)}
                    className="mt-5 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
                  >
                    Delete Subject
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Subjects;