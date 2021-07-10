const { data } = require("../src/constants/quizzes");

describe("quizzes", () => {
  test("has no quizzes with the same nationalities", () => {
    const convertedQuizzes = data.map((q) =>
      Object.values(q.players)
        .map((p) => p.nationality)
        .join("")
    );
    const quizMap = {};
    convertedQuizzes.forEach((q) => {
      if (quizMap[q] === undefined) {
        quizMap[q] = 1;
      } else {
        quizMap[q]++;
      }
    });
    expect(Object.values(quizMap).filter((v) => v > 1).length).toBe(0);
  });
});
