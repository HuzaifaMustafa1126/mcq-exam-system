const positiveInteger = (value, fallback, maximum) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return maximum ? Math.min(number, maximum) : number;
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const optionalPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

export const paginationQuery = (query, { limit = 20, maximumLimit = 100 } = {}) => ({
  page: positiveInteger(query.page, 1),
  limit: positiveInteger(query.limit, limit, maximumLimit),
});

export const teacherListQuery = (query) => ({ ...paginationQuery(query), search: text(query.search) });
export const subjectListQuery = (query) => ({ ...paginationQuery(query), search: text(query.search) });

export const studentListQuery = (query) => ({
  ...paginationQuery(query),
  search: text(query.search),
  semester: optionalPositiveInteger(query.semester),
  section: text(query.section),
  status: text(query.status),
});

export const questionListQuery = (query) => ({
  ...paginationQuery(query),
  search: text(query.search),
  subjectId: optionalPositiveInteger(query.subjectId),
  difficulty: text(query.difficulty),
  status: text(query.status),
});

export const examListQuery = (query) => ({
  ...paginationQuery(query),
  search: text(query.search),
  subjectId: optionalPositiveInteger(query.subjectId),
  status: text(query.status),
});

export const resultListQuery = (query) => ({
  ...paginationQuery(query),
  search: text(query.search),
  studentId: optionalPositiveInteger(query.studentId),
  subjectId: optionalPositiveInteger(query.subjectId),
  examId: optionalPositiveInteger(query.examId),
  dateFrom: text(query.dateFrom),
  dateTo: text(query.dateTo),
  status: text(query.status),
});
