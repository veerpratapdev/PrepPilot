import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

function SmartPlanner() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const studyStartTime = "09:00";
  const topicDurationMinutes = 45;
  const breakMinutes = 15;
  const maxSlotsPerDay = 5;

  useEffect(() => {
    const loadSubjects = async () => {
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
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error("Error loading smart planner:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const getDaysLeft = (examDate) => {
    if (!examDate) return 999;

    const today = new Date();
    const exam = new Date(examDate);

    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);

    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  };

  const addDays = (days) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeSlot = (slotIndex) => {
    const [hours, minutes] = studyStartTime.split(":").map(Number);

    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(
      startDate.getMinutes() +
        slotIndex * (topicDurationMinutes + breakMinutes)
    );

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + topicDurationMinutes);

    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  };

  const getPriorityScore = (subject, pendingTopics, daysLeft) => {
    const progress = Number(subject.progress || 0);

    let urgencyScore = 20;

    if (daysLeft <= 1) {
      urgencyScore = 100;
    } else if (daysLeft <= 3) {
      urgencyScore = 80;
    } else if (daysLeft <= 7) {
      urgencyScore = 60;
    } else if (daysLeft <= 15) {
      urgencyScore = 40;
    }

    const pendingScore = pendingTopics.length * 5;
    const weaknessScore = 100 - progress;

    return urgencyScore + pendingScore + weaknessScore;
  };

  const subjectsWithPlan = subjects
    .filter((subject) => subject.examDate)
    .map((subject) => {
      const pendingTopics = (subject.topics || []).filter(
        (topic) => !topic.completed
      );

      const daysLeft = getDaysLeft(subject.examDate);
      const availableStudyDays = Math.max(daysLeft - 2, 1);

      const topicsPerDay =
        pendingTopics.length > 0
          ? Math.ceil(pendingTopics.length / availableStudyDays)
          : 0;

      const priorityScore = getPriorityScore(
        subject,
        pendingTopics,
        daysLeft
      );

      return {
        ...subject,
        pendingTopics,
        daysLeft,
        topicsPerDay,
        priorityScore,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const weeklyPlan = [];

  for (let day = 0; day < 7; day++) {
    const currentDate = addDays(day);

    const dayPlan = {
      date: formatDate(currentDate),
      slots: [],
    };

    let slotIndex = 0;

    subjectsWithPlan.forEach((subject) => {
      if (slotIndex >= maxSlotsPerDay) return;
      if (subject.daysLeft < day) return;

      if (subject.daysLeft === day) {
        dayPlan.slots.push({
          time: getTimeSlot(slotIndex),
          subjectName: subject.name,
          topic: "Quick revision + Exam Day",
          type: "exam",
          duration: `${topicDurationMinutes} min`,
        });

        slotIndex++;
        return;
      }

      if (subject.daysLeft - day === 1) {
        dayPlan.slots.push({
          time: getTimeSlot(slotIndex),
          subjectName: subject.name,
          topic: "Final revision + formulas + mock test",
          type: "revision",
          duration: `${topicDurationMinutes} min`,
        });

        slotIndex++;
        return;
      }

      const topicStartIndex = day * subject.topicsPerDay;
      const todaysTopics = subject.pendingTopics.slice(
        topicStartIndex,
        topicStartIndex + subject.topicsPerDay
      );

      todaysTopics.forEach((topic) => {
        if (slotIndex >= maxSlotsPerDay) return;

        dayPlan.slots.push({
          time: getTimeSlot(slotIndex),
          subjectName: subject.name,
          topic: topic.title || "Untitled Topic",
          type: "study",
          duration: `${topicDurationMinutes} min`,
        });

        slotIndex++;
      });
    });

    if (dayPlan.slots.length > 0) {
      weeklyPlan.push(dayPlan);
    }
  }

  const todayTasks = weeklyPlan.length > 0 ? weeklyPlan[0].slots : [];

  const urgentSubjects = subjectsWithPlan.filter(
    (subject) => subject.daysLeft <= 7 && subject.daysLeft >= 0
  );

  const totalPendingTopics = subjectsWithPlan.reduce(
    (sum, subject) => sum + subject.pendingTopics.length,
    0
  );

  const todayStudyMinutes = todayTasks.length * topicDurationMinutes;
  const todayStudyHours = Math.floor(todayStudyMinutes / 60);
  const todayRemainingMinutes = todayStudyMinutes % 60;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />

        <main className="p-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-cyan-400">
            Loading Smart Planner V7...
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
          <h1 className="text-4xl font-bold">
            Smart <span className="text-cyan-400">Planner V7</span>
          </h1>

          <p className="text-slate-300 mt-2">
            Date-wise and time-wise study schedule based on exam urgency,
            pending topics, and subject progress.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
            <h2 className="text-slate-300">Total Subjects</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {subjects.length}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
            <h2 className="text-slate-300">Planned Subjects</h2>
            <p className="text-4xl font-bold text-cyan-400 mt-3">
              {subjectsWithPlan.length}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
            <h2 className="text-slate-300">Pending Topics</h2>
            <p className="text-4xl font-bold text-yellow-400 mt-3">
              {totalPendingTopics}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
            <h2 className="text-slate-300">Urgent Exams</h2>
            <p className="text-4xl font-bold text-red-400 mt-3">
              {urgentSubjects.length}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 border border-cyan-400 p-6 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400">
                📅 Today's Smart Schedule
              </h2>

              <p className="text-slate-300 mt-1">
                Total study time:{" "}
                <span className="text-cyan-400 font-semibold">
                  {todayStudyHours}h {todayRemainingMinutes}m
                </span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl px-5 py-3">
              <p className="text-slate-400 text-sm">Study starts at</p>
              <p className="text-xl font-bold text-cyan-400">09:00 AM</p>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <p className="text-slate-300">
              No study slots for today. Add exam dates and pending topics in
              Subjects page.
            </p>
          ) : (
            <div className="space-y-4">
              {todayTasks.map((task, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border ${
                    task.type === "exam"
                      ? "bg-red-950 border-red-500"
                      : task.type === "revision"
                      ? "bg-yellow-950 border-yellow-500"
                      : "bg-slate-900 border-slate-700"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div>
                      <p className="text-cyan-400 font-bold text-lg">
                        {task.time}
                      </p>

                      <h3 className="text-xl font-bold mt-1">
                        {task.subjectName}
                      </h3>

                      <p className="text-slate-300 mt-1">{task.topic}</p>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold w-fit ${
                        task.type === "exam"
                          ? "bg-red-500 text-white"
                          : task.type === "revision"
                          ? "bg-yellow-400 text-slate-900"
                          : "bg-cyan-500 text-slate-900"
                      }`}
                    >
                      {task.type.toUpperCase()} · {task.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            🔥 Priority Subjects
          </h2>

          {subjectsWithPlan.length === 0 ? (
            <p className="text-slate-300">
              Add exam dates in Subjects page to generate priority planning.
            </p>
          ) : (
            <div className="space-y-4">
              {subjectsWithPlan.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-slate-900 border border-slate-700 p-5 rounded-xl"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-cyan-400">
                        {subject.name}
                      </h3>

                      <p className="text-slate-400 mt-1">
                        Exam Date: {subject.examDate}
                      </p>

                      <p className="text-slate-400 mt-1">
                        Pending Topics: {subject.pendingTopics.length}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p
                        className={`text-xl font-bold ${
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
                      </p>

                      <p className="text-slate-400 text-sm">
                        Priority Score: {subject.priorityScore}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{Number(subject.progress || 0)}%</span>
                    </div>

                    <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-3 rounded-full"
                        style={{
                          width: `${Number(subject.progress || 0)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            📆 7-Day Time Table
          </h2>

          {weeklyPlan.length === 0 ? (
            <p className="text-slate-300">
              No weekly plan available. Add topics and exam dates first.
            </p>
          ) : (
            <div className="space-y-8">
              {weeklyPlan.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="bg-slate-900 border border-slate-700 p-5 rounded-2xl"
                >
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold text-cyan-400">
                      {day.date}
                    </h3>

                    <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-full text-sm">
                      {day.slots.length} slots
                    </span>
                  </div>

                  <div className="space-y-3">
                    {day.slots.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className={`p-4 rounded-xl border ${
                          slot.type === "exam"
                            ? "bg-red-950 border-red-500"
                            : slot.type === "revision"
                            ? "bg-yellow-950 border-yellow-500"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                          <div>
                            <p className="font-bold text-cyan-400">
                              {slot.time}
                            </p>

                            <p className="text-white font-semibold mt-1">
                              {slot.subjectName}
                            </p>

                            <p className="text-slate-300">{slot.topic}</p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                              slot.type === "exam"
                                ? "bg-red-500 text-white"
                                : slot.type === "revision"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-cyan-500 text-slate-900"
                            }`}
                          >
                            {slot.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
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

export default SmartPlanner;