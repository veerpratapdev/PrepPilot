import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { calculateStudyStreak } from "../utils/streakSystem";

function Achievements() {
  const [subjects, setSubjects] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSubjects(data.subjects || []);
        setStudySessions(data.studySessions || []);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalStudyHours = studySessions.reduce(
    (sum, session) => sum + Number(session.duration || 0),
    0
  );

  const completedSubjects = subjects.filter(
    (subject) => Number(subject.progress || 0) >= 100
  ).length;

  const streakData = calculateStudyStreak(studySessions);

  const totalXP =
    subjects.length * 10 +
    studySessions.length * 20 +
    completedSubjects * 50 +
    Math.floor(totalStudyHours / 2) * 30 +
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

  const achievements = useMemo(
    () => [
      {
        id: "first_subject",
        title: "First Subject Added",
        description: "Add your first study subject.",
        unlocked: subjects.length >= 1,
        progress: subjects.length,
        target: 1,
        xpReward: 10,
      },
      {
        id: "study_starter",
        title: "Study Starter",
        description: "Complete your first study session.",
        unlocked: studySessions.length >= 1,
        progress: studySessions.length,
        target: 1,
        xpReward: 20,
      },
      {
        id: "five_sessions",
        title: "5 Study Sessions",
        description: "Complete 5 study sessions.",
        unlocked: studySessions.length >= 5,
        progress: studySessions.length,
        target: 5,
        xpReward: 50,
      },
      {
        id: "ten_hours",
        title: "10 Hours Studied",
        description: "Study for total 10 hours.",
        unlocked: totalStudyHours >= 10,
        progress: totalStudyHours,
        target: 10,
        xpReward: 80,
      },
      {
        id: "subject_master",
        title: "Subject Master",
        description: "Complete one subject 100%.",
        unlocked: completedSubjects >= 1,
        progress: completedSubjects,
        target: 1,
        xpReward: 100,
      },
      {
        id: "multi_subject",
        title: "Multi Subject Learner",
        description: "Add at least 5 subjects.",
        unlocked: subjects.length >= 5,
        progress: subjects.length,
        target: 5,
        xpReward: 60,
      },
      {
        id: "three_day_streak",
        title: "3 Day Streak",
        description: "Study for 3 days continuously.",
        unlocked: streakData.currentStreak >= 3,
        progress: streakData.currentStreak,
        target: 3,
        xpReward: 50,
      },
      {
        id: "seven_day_streak",
        title: "7 Day Streak",
        description: "Study for 7 days continuously.",
        unlocked: streakData.currentStreak >= 7,
        progress: streakData.currentStreak,
        target: 7,
        xpReward: 100,
      },
      {
        id: "thirty_day_streak",
        title: "30 Day Streak",
        description: "Study for 30 days continuously.",
        unlocked: streakData.currentStreak >= 30,
        progress: streakData.currentStreak,
        target: 30,
        xpReward: 300,
      },
    ],
    [
      subjects.length,
      studySessions.length,
      totalStudyHours,
      completedSubjects,
      streakData.currentStreak,
    ]
  );

  useEffect(() => {
    if (loading) return;

    const user = auth.currentUser;
    if (!user) return;

    const storageKey = `preppilot_unlocked_achievements_${user.uid}`;

    let savedUnlocked = [];

    try {
      const oldData = localStorage.getItem(storageKey);
      savedUnlocked = oldData ? JSON.parse(oldData) : [];
    } catch {
      savedUnlocked = [];
    }

    const unlockedNow = achievements.filter(
      (achievement) => achievement.unlocked
    );

    const newAchievement = unlockedNow.find(
      (achievement) => !savedUnlocked.includes(achievement.id)
    );

    if (!newAchievement) return;

    const updatedUnlocked = unlockedNow.map((achievement) => achievement.id);
    localStorage.setItem(storageKey, JSON.stringify(updatedUnlocked));

    const showTimer = setTimeout(() => {
      setToast(newAchievement);
    }, 0);

    const hideTimer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [loading, achievements]);

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked
  ).length;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-900 text-white p-8">
          <h1 className="text-2xl font-bold text-cyan-400">
            Loading achievements...
          </h1>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-slate-800 border border-cyan-400 text-white rounded-2xl shadow-2xl p-5 w-80">
          <p className="text-cyan-400 font-bold text-lg">
            🎉 Achievement Unlocked!
          </p>

          <h3 className="text-2xl font-bold mt-2">{toast.title}</h3>

          <p className="text-slate-300 mt-1">{toast.description}</p>

          <p className="text-yellow-400 font-bold mt-3">
            +{toast.xpReward} XP Reward
          </p>
        </div>
      )}

      <div className="min-h-screen bg-slate-900 text-white px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            🏆 Achievements
          </h1>
          <p className="text-slate-300">
            Track your XP, level, study streak, and unlocked badges.
          </p>
        </div>

        <div className="bg-slate-800 border border-cyan-400 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Current Rank</p>
              <h2 className="text-3xl font-bold text-cyan-400">
                Level {level} Student
              </h2>
              <p className="text-slate-300 mt-2">Total XP: {totalXP}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-cyan-400">
                  {subjects.length}
                </p>
                <p className="text-sm text-slate-400">Subjects</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-cyan-400">
                  {studySessions.length}
                </p>
                <p className="text-sm text-slate-400">Sessions</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-orange-400">
                  {streakData.currentStreak}
                </p>
                <p className="text-sm text-slate-400">Streak</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-cyan-400">
                  {unlockedAchievements}/{achievements.length}
                </p>
                <p className="text-sm text-slate-400">Badges</p>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-cyan-400 h-4 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            ></div>
          </div>

          <p className="text-sm text-slate-300 mt-2">
            {level === 10
              ? "Max Level Reached"
              : `${totalXP} / ${nextLevelXP} XP to reach Level ${level + 1}`}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-orange-400 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-2">
              🔥 Current Streak
            </h2>
            <p className="text-5xl font-bold">{streakData.currentStreak}</p>
            <p className="text-slate-300 mt-2">days continuously studied</p>
          </div>

          <div className="bg-slate-800 border border-cyan-400 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">
              🏅 Best Streak
            </h2>
            <p className="text-5xl font-bold">{streakData.longestStreak}</p>
            <p className="text-slate-300 mt-2">best study streak</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Today Status
            </h2>
            <p
              className={`text-2xl font-bold ${
                streakData.studiedToday ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {streakData.studiedToday ? "✅ Completed" : "⏳ Pending"}
            </p>
            <p className="text-slate-300 mt-2">
              {streakData.studiedToday
                ? "You studied today."
                : "Add a study session today to continue streak."}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Badge Collection
          </h2>
          <p className="text-slate-400">
            Unlock more badges by studying regularly and completing subjects.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const progressPercent = Math.min(
              Math.round((achievement.progress / achievement.target) * 100),
              100
            );

            return (
              <div
                key={achievement.id}
                className={`p-6 rounded-2xl shadow-lg border transition ${
                  achievement.unlocked
                    ? "bg-slate-800 border-cyan-400"
                    : "bg-slate-800 border-slate-700 opacity-80"
                }`}
              >
                <div className="text-5xl mb-4">
                  {achievement.unlocked ? "🏆" : "🔒"}
                </div>

                <h2 className="text-xl font-bold mb-2 text-white">
                  {achievement.title}
                </h2>

                <p className="text-slate-300 mb-4">
                  {achievement.description}
                </p>

                <p className="text-yellow-400 text-sm font-semibold mb-4">
                  Reward: +{achievement.xpReward} XP
                </p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.min(achievement.progress, achievement.target)} /{" "}
                      {achievement.target}
                    </span>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        achievement.unlocked ? "bg-cyan-400" : "bg-slate-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    achievement.unlocked
                      ? "bg-cyan-500 text-slate-900"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {achievement.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default Achievements;