export const getSessionDate = (session) => {
    if (!session) return null;

    const rawDate =
        session.date ||
        session.createdAt ||
        session.sessionDate ||
        session.completedAt;

    if (rawDate && rawDate.seconds) {
        return new Date(rawDate.seconds * 1000);
    }

    return new Date(rawDate);
};

export const formatDateKey = (date) => {
    if (!date || Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const calculateStudyStreak = (studySessions = []) => {
    const studiedDateKeys = new Set();

    studySessions.forEach((session) => {
        const date = getSessionDate(session);
        const dateKey = formatDateKey(date);

        if (dateKey) {
            studiedDateKeys.add(dateKey);
        }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = formatDateKey(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    let startDate = today;

    if (!studiedDateKeys.has(todayKey) && studiedDateKeys.has(yesterdayKey)) {
        startDate = yesterday;
    }

    let currentStreak = 0;
    const checkerDate = new Date(startDate);

    while (true) {
        const key = formatDateKey(checkerDate);

        if (studiedDateKeys.has(key)) {
            currentStreak++;
            checkerDate.setDate(checkerDate.getDate() - 1);
        } else {
            break;
        }
    }

    const sortedDates = Array.from(studiedDateKeys).sort();

    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    sortedDates.forEach((dateKey) => {
        const currentDate = new Date(dateKey);

        if (!previousDate) {
            tempStreak = 1;
        } else {
            const difference =
                (currentDate - previousDate) / (1000 * 60 * 60 * 24);

            if (difference === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        previousDate = currentDate;
    });

    return {
        currentStreak,
        longestStreak,
        studiedDays: studiedDateKeys.size,
        studiedToday: studiedDateKeys.has(todayKey),
    };
};