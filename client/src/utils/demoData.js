export const exams = [
  { id: 1, title: 'Advanced JavaScript', subject: 'Web Development', description: 'Test your knowledge of modern JavaScript patterns and APIs.', questions: 25, duration: 30, difficulty: 'Intermediate', color: 'from-violet-500 to-indigo-500' },
  { id: 2, title: 'Database Fundamentals', subject: 'Computer Science', description: 'Core concepts in relational modelling and SQL.', questions: 20, duration: 25, difficulty: 'Beginner', color: 'from-cyan-500 to-blue-500' },
  { id: 3, title: 'Data Structures', subject: 'Programming', description: 'Algorithms, complexity and essential data structures.', questions: 35, duration: 45, difficulty: 'Advanced', color: 'from-fuchsia-500 to-purple-500' },
]
export const questions = [
  { text: 'Which JavaScript method creates a new array with the results of calling a function for every element?', options: ['filter()', 'map()', 'reduce()', 'forEach()'], answer: 1 },
  { text: 'Which SQL clause is used to filter groups after aggregation?', options: ['WHERE', 'ORDER BY', 'HAVING', 'LIMIT'], answer: 2 },
  { text: 'What is the average lookup complexity of a hash table?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 0 },
]
