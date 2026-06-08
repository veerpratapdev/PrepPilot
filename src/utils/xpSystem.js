export const calculateXP = (subjects = [], studySessions = []) => {
    const subjectXP = subjects.length * 10;
    const sessionXP = studySessions.length * 20;

    const completedSubjects = subjects.filter(
        (subject) => Number(subject.progress || 0) >= 100
    ).length;

    const completedSubjectXP = completedSubjects * 50;

    const totalStudyHours = studySessions.reduce(
        (sum, session) => sum + Number(session.duration || 0),
        0
    );

    const studyHourXP = Math.floor(totalStudyHours / 2) * 30;

    return subjectXP + sessionXP + completedSubjectXP + studyHourXP;
};

export const calculateLevel = (xp) => {
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

export const getNextLevelXP = (level) => {
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

export const getCurrentLevelXP = (level) => {
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