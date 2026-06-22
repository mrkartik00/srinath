const Organization = require('../models/Organization');
const { NotFoundError } = require('../utils/apiError');

const create = async (data) => Organization.create(data);

const getById = async (orgId) => {
  const org = await Organization.findById(orgId);
  if (!org) throw new NotFoundError('Organization not found');
  return org;
};

const update = async (orgId, data) => {
  const org = await Organization.findByIdAndUpdate(orgId, data, { new: true, runValidators: true });
  if (!org) throw new NotFoundError('Organization not found');
  return org;
};

module.exports = { create, getById, update };
