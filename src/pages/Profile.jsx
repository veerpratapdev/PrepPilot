import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { calculateStudyStreak } from "../utils/streakSystem";
import jsPDF from "jspdf";

function Profile() {
  const [subjects, setSubjects] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setUserData(data);
          setSubjects(data.subjects || []);
          setStudySessions(data.studySessions || []);
        } else {
          setUserData(null);
          setSubjects([]);
          setStudySessions([]);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const studentName =
    userData?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "PrepPilot Student";

  const totalStudyMinutes = studySessions.reduce(
    (total, session) =>
      total + Number(session.minutes || session.duration || 0),
    0
  );

  const totalStudyHours = Math.floor(totalStudyMinutes / 60);
  const remainingMinutes = totalStudyMinutes % 60;

  const allTopics = subjects.flatMap((subject) => subject.topics || []);
  const completedTopics = allTopics.filter((topic) => topic.completed);

  const completedSubjects = subjects.filter(
    (subject) => Number(subject.progress || 0) >= 100
  ).length;

  const overallProgress =
    allTopics.length === 0
      ? 0
      : Math.round((completedTopics.length / allTopics.length) * 100);

  const streakData = calculateStudyStreak(studySessions);

  const totalXP =
    subjects.length * 10 +
    studySessions.length * 20 +
    completedSubjects * 50 +
    Math.floor(totalStudyMinutes / 120) * 30 +
    streakData.currentStreak * 10;

  const getLevel = (xp) => {
    if (xp >= 1000) return 10;
    if (xp >= 800) return 9;
    if (xp >= 650) return 8;
    if (xp >= 500) return 7;
    if (xp >= 350) return 6;
    if (xp >= 250) return 5;
    if (xp >= 150) return 4;
    if (xp >= 80) return 3;
    if (xp >= 30) return 2;
    return 1;
  };

  const getCurrentLevelXP = (level) => {
    const xpMap = {
      1: 0,
      2: 30,
      3: 80,
      4: 150,
      5: 250,
      6: 350,
      7: 500,
      8: 650,
      9: 800,
      10: 1000,
    };

    return xpMap[level] || 0;
  };

  const getNextLevelXP = (level) => {
    const xpMap = {
      1: 30,
      2: 80,
      3: 150,
      4: 250,
      5: 350,
      6: 500,
      7: 650,
      8: 800,
      9: 1000,
      10: 1000,
    };

    return xpMap[level] || 1000;
  };

  const level = getLevel(totalXP);
  const currentLevelXP = getCurrentLevelXP(level);
  const nextLevelXP = getNextLevelXP(level);

  const levelProgress =
    level === 10
      ? 100
      : Math.round(
          ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        );

  const achievementRules = [
    subjects.length >= 1,
    studySessions.length >= 1,
    studySessions.length >= 5,
    totalStudyMinutes >= 600,
    completedSubjects >= 1,
    subjects.length >= 5,
    streakData.currentStreak >= 3,
    streakData.currentStreak >= 7,
    streakData.currentStreak >= 30,
  ];

  const unlockedAchievements = achievementRules.filter(Boolean).length;
  const totalAchievements = achievementRules.length;

  const handleDownloadReport = () => {
    const docPDF = new jsPDF();

    docPDF.setFontSize(22);
    docPDF.text("PrepPilot Progress Report", 20, 20);

    docPDF.setFontSize(12);
    docPDF.text(`Student Name: ${studentName}`, 20, 40);
    docPDF.text(`Email: ${user?.email || "N/A"}`, 20, 50);
    docPDF.text(`Level: ${level}`, 20, 60);
    docPDF.text(`Total XP: ${totalXP}`, 20, 70);
    docPDF.text(`Current Streak: ${streakData.currentStreak} days`, 20, 80);
    docPDF.text(`Best Streak: ${streakData.longestStreak} days`, 20, 90);

    docPDF.text(`Total Subjects: ${subjects.length}`, 20, 110);
    docPDF.text(`Study Sessions: ${studySessions.length}`, 20, 120);
    docPDF.text(
      `Total Study Time: ${totalStudyHours}h ${remainingMinutes}m`,
      20,
      130
    );
    docPDF.text(
      `Completed Topics: ${completedTopics.length}/${allTopics.length}`,
      20,
      140
    );
    docPDF.text(`Overall Progress: ${overallProgress}%`, 20, 150);
    docPDF.text(
      `Achievements: ${unlockedAchievements}/${totalAchievements}`,
      20,
      160
    );

    docPDF.setFontSize(16);
    docPDF.text("Subjects Summary", 20, 180);

    docPDF.setFontSize(11);

    let y = 190;

    if (subjects.length === 0) {
      docPDF.text("No subjects added yet.", 20, y);
    } else {
      subjects.slice(0, 8).forEach((subject, index) => {
        const totalTopics = (subject.topics || []).length;
        const completed = (subject.topics || []).filter(
          (topic) => topic.completed
        ).length;

        docPDF.text(
          `${index + 1}. ${subject.name} - ${completed}/${totalTopics} topics completed`,
          20,
          y
        );

        y += 10;
      });
    }

    docPDF.save(`${studentName}-PrepPilot-Report.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />

        <main className="p-8">
          <h1 className="text-2xl font-bold text-cyan-400">
            Loading Profile...
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">
            👤 Student Profile
          </h1>
          <p className="text-slate-300 mt-2">
            View your learning stats, XP, streak, and progress summary.
          </p>
        </div>

        <div className="bg-slate-800 border border-cyan-400 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center text-4xl font-bold">
                {studentName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">
                  {studentName}
                </h2>

                <p className="text-slate-300 mt-1">{user?.email}</p>

                <p className="text-cyan-400 font-semibold mt-2">
                  Level {level} Student
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-center">
              <p className="text-slate-400 text-sm">Total XP</p>
              <p className="text-4xl font-bold text-cyan-400">{totalXP}</p>

              <button
                onClick={handleDownloadReport}
                className="mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-5 py-3 rounded-lg font-semibold"
              >
                📄 Download Progress Report
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Level Progress</span>
              <span>
                {level === 10
                  ? "Max Level"
                  : `${totalXP} / ${nextLevelXP} XP`}
              </span>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-cyan-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-slate-300">Subjects</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {subjects.length}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-slate-300">Study Sessions</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {studySessions.length}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-slate-300">Study Time</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {totalStudyHours}h {remainingMinutes}m
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-slate-300">Overall Progress</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {overallProgress}%
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-orange-400 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-orange-400">
              🔥 Current Streak
            </h2>
            <p className="text-5xl font-bold mt-4">
              {streakData.currentStreak}
            </p>
            <p className="text-slate-300 mt-2">days continuously studied</p>
          </div>

          <div className="bg-slate-800 border border-cyan-400 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-cyan-400">
              🏅 Best Streak
            </h2>
            <p className="text-5xl font-bold mt-4">
              {streakData.longestStreak}
            </p>
            <p className="text-slate-300 mt-2">best streak record</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white">
              🎖️ Achievements
            </h2>
            <p className="text-5xl font-bold mt-4 text-cyan-400">
              {unlockedAchievements}/{totalAchievements}
            </p>
            <p className="text-slate-300 mt-2">badges unlocked</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            📊 Learning Summary
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-xl font-bold mb-4">Topics</h3>

              <p className="text-slate-300">
                Completed Topics:{" "}
                <span className="text-cyan-400 font-bold">
                  {completedTopics.length}
                </span>
              </p>

              <p className="text-slate-300 mt-2">
                Total Topics:{" "}
                <span className="text-cyan-400 font-bold">
                  {allTopics.length}
                </span>
              </p>

              <p className="text-slate-300 mt-2">
                Pending Topics:{" "}
                <span className="text-yellow-400 font-bold">
                  {allTopics.length - completedTopics.length}
                </span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-xl font-bold mb-4">Performance</h3>

              <p className="text-slate-300">
                Completed Subjects:{" "}
                <span className="text-cyan-400 font-bold">
                  {completedSubjects}
                </span>
              </p>

              <p className="text-slate-300 mt-2">
                Studied Days:{" "}
                <span className="text-cyan-400 font-bold">
                  {streakData.studiedDays}
                </span>
              </p>

              <p className="text-slate-300 mt-2">
                Today Status:{" "}
                <span
                  className={`font-bold ${
                    streakData.studiedToday
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {streakData.studiedToday ? "Completed" : "Pending"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;