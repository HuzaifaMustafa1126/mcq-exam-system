export const sendSuccess = (res, { statusCode = 200, ...payload }) =>
  res.status(statusCode).json({ success: true, ...payload });

export const sendError = (res, { statusCode = 500, message, details }) => {
  const payload = { success: false, message };

  if (details) payload.details = details;

  return res.status(statusCode).json(payload);
};
