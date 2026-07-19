import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import { authenticateUser, updateAuthenticatedUser } from '../services/auth.service.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/response.js';

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  const token = generateToken(user);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    token,
    user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateAuthenticatedUser(req.user.id, req.body);
  return sendSuccess(res, { data: { user, token: generateToken(user) } });
});
