function validateBody(validator) {
  return (req, _res, next) => {
    const { value, errors } = validator(req.body ?? {});
    if (errors.length) {
      const err = new Error('Validation failed');
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.details = errors;
      return next(err);
    }
    req.validatedBody = value;
    return next();
  };
}

module.exports = { validateBody };
