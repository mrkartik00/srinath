const { PAGINATION } = require('../config/constants');

const paginate = async (model, filter = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    parseInt(options.limit, 10) || PAGINATION.DEFAULT_LIMIT
  );
  const skip = (page - 1) * limit;

  let query = model.find(filter).sort(options.sort || { createdAt: -1 }).skip(skip).limit(limit);

  if (options.populate) {
    (Array.isArray(options.populate) ? options.populate : [options.populate]).forEach((p) => {
      query = query.populate(p);
    });
  }

  const [data, total] = await Promise.all([
    query.lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = paginate;
