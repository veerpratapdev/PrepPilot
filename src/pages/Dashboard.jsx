import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";

import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

import { calculateStudyStreak } from "../utils/streakSystem";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setSubjects(data.subjects || []);
          setSessions(data.studySessions || []);
        } else {
          setSubjects([]);
          setSessions([]);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const allTopics = subjects.flatMap((subject) => subject.topics || []);

  const completedTopics = allTopics.filter((topic) => topic.completed);

  const progress =
    allTopics.length === 0
      ? 0
      : Math.round((completedTopics.length / allTopics.length) * 100);

  const totalStudyMinutes = sessions.reduce(
    (total, session) =>
      total + Number(session.minutes || session.duration || 0),
    0
  );

  const totalStudyHours = Math.floor(totalStudyMinutes / 60);
  const remainingMinutes = totalStudyMinutes % 60;

  const completedSubjects = subjects.filter(
    (subject) => Number(subject.progress || 0) >= 100
  ).length;

  const streakData = calculateStudyStreak(sessions);

  const totalXP =
    subjects.length * 10 +
    sessions.length * 20 +
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
          ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) *
            100
        );

  const achievementRules = [
    subjects.length >= 1,
    sessions.length >= 1,
    sessions.length >= 5,
    totalStudyMinutes >= 600,
    completedSubjects >= 1,
    subjects.length >= 5,
    streakData.currentStreak >= 3,
    streakData.currentStreak >= 7,
    streakData.currentStreak >= 30,
  ];

  const unlockedAchievements = achievementRules.filter(Boolean).length;
  const totalAchievements = achievementRules.length;

  const todaysFocus = subjects
    .flatMap((subject) =>
      (subject.topics || [])
        .filter((topic) => !topic.completed)
        .map((topic) => ({
          subject: subject.name,
          topic: topic.title,
          examDate: subject.examDate,
        }))
    )
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
    .slice(0, 5);

  const upcomingExams = subjects
    .filter((subject) => subject.examDate)
    .map((subject) => {
      const today = new Date();
      const exam = new Date(subject.examDate);

      today.setHours(0, 0, 0, 0);
      exam.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil(
        (exam - today) / (1000 * 60 * 60 * 24)
      );

      return {
        ...subject,
        daysLeft,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const subjectChartData = subjects.map((subject) => {
    const totalTopics = (subject.topics || []).length;

    const completed = (subject.topics || []).filter(
      (topic) => topic.completed
    ).length;

    const subjectProgress =
      totalTopics === 0
        ? 0
        : Math.round((completed / totalTopics) * 100);

    return {
      name: subject.name,
      progress: subjectProgress,
    };
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weeklyStudyData = weekDays.map((day) => ({
    day,
    minutes: 0,
  }));

  sessions.forEach((session) => {
    if (!session.date) return;

    const date = new Date(session.date);

    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

    weeklyStudyData[dayIndex].minutes += Number(
      session.minutes || session.duration || 0
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />

        <main className="p-8">
          <h1 className="text-2xl font-bold text-cyan-400">
            Loading Dashboard...
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to <span className="text-cyan-400">PrepPilot</span>
        </h1>

        <div className="bg-slate-800 border border-cyan-400 p-6 rounded-2xl mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">
                Gamification Overview
              </p>

              <h2 className="text-3xl font-bold text-cyan-400">
                🏆 Level {level} Student
              </h2>

              <p className="text-slate-300 mt-2">
                Keep studying to gain XP, unlock badges, and grow your streak.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-2xl font-bold text-cyan-400">
                  {totalXP}
                </p>
                <p className="text-sm text-slate-400">XP</p>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-2xl font-bold text-orange-400">
                  {streakData.currentStreak}
                </p>
                <p className="text-sm text-slate-400">Streak</p>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p className="text-2xl font-bold text-cyan-400">
                  {unlockedAchievements}/{totalAchievements}
                </p>
                <p className="text-sm text-slate-400">Badges</p>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <p
                  className={`text-xl font-bold ${
                    streakData.studiedToday
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {streakData.studiedToday ? "Done" : "Pending"}
                </p>
                <p className="text-sm text-slate-400">Today</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
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

        <div className="bg-slate-800 p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            🎯 Today's Focus
          </h2>

          {todaysFocus.length === 0 ? (
            <p className="text-green-400">
              All topics completed. Time for revision 🚀
            </p>
          ) : (
            <div className="space-y-3">
              {todaysFocus.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-700 p-4 rounded-xl"
                >
                  <span className="text-cyan-400 font-bold">
                    {item.subject}
                  </span>
                  <span className="text-slate-300"> → {item.topic}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-300">Total Subjects</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {subjects.length}
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-300">Completed Topics</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {completedTopics.length}/{allTopics.length}
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-300">Study Time</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {totalStudyHours}h {remainingMinutes}m
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl">
            <h2 className="text-slate-300">Overall Progress</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {progress}%
            </p>

            <ProgressBar progress={progress} />
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            Subject Progress Chart
          </h2>

          {subjectChartData.length === 0 ? (
            <p className="text-slate-300">
              Add subjects to view analytics.
            </p>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    stroke="#334155"
                    strokeDasharray="5 5"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #22d3ee",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />

                  <Bar
                    dataKey="progress"
                    fill="#06b6d4"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl mt-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            Weekly Study Analytics
          </h2>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyStudyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="5 5"
                />

                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tick={{ fill: "#cbd5e1" }}
                />

                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: "#cbd5e1" }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #22d3ee",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />

                <Bar
                  dataKey="minutes"
                  fill="#22d3ee"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl mt-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            Upcoming Exams
          </h2>

          {upcomingExams.length === 0 ? (
            <p className="text-slate-300">No exam dates added yet.</p>
          ) : (
            <div className="space-y-4">
              {upcomingExams.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg">{subject.name}</h3>

                    <p className="text-slate-400">
                      Exam: {subject.examDate}
                    </p>
                  </div>

                  <div
                    className={`font-bold text-lg ${
                      subject.daysLeft <= 3
                        ? "text-red-400"
                        : subject.daysLeft <= 7
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {subject.daysLeft < 0
                      ? "Exam passed"
                      : `${subject.daysLeft} days left`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;