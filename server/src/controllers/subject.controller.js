import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from '../services/subject.service.js';
import { sendSuccess } from '../utils/response.js';
import { subjectListQuery } from '../utils/query.js';

export const create = asyncHandler(async (req, res) => {
  const subject = await createSubject(req.body);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    data: subject,
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const data = await getSubjects(subjectListQuery(req.query));

  return sendSuccess(res, { data });
});

export const getById = asyncHandler(async (req, res) => {
  const subject = await getSubjectById(req.params.id);

  return sendSuccess(res, { data: subject });
});

export const update = asyncHandler(async (req, res) => {
  const subject = await updateSubject(req.params.id, req.body);

  return sendSuccess(res, { data: subject });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteSubject(req.params.id);

  return sendSuccess(res, {
    data: { message: 'Subject deleted successfully' },
  });
});
