/**
 * Zod validation middleware for Express routes
 *
 * Usage: router.post('/path', authenticate, validate(mySchema), handler)
 *
 * - For GET/DELETE requests, validates req.params
 * - For POST/PATCH/PUT requests, validates req.body
 * - On success: merges validated data back into req.body/req.params and calls next()
 * - On failure: returns 400 with field-level error messages
 */
export const validate =
  (schema) =>
    (req, res, next) => {
      // For GET/DELETE routes, validate URL params; for POST/PATCH/PUT, validate request body
      const source = (req.method === 'GET' || req.method === 'DELETE') ? req.params : req.body;
      const result = schema.safeParse(source);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        const messages = Object.entries(fieldErrors).map(([field, errors]) =>
          errors && errors.length ? `${field}: ${errors.join(', ')}` : field
        );
        return res.status(400).json({
          success: false,
          error: messages.join('; ') || 'Validation failed',
        });
      }

      // Merge validated data back into request
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        req.body = { ...req.body, ...result.data };
      } else {
        req.params = { ...req.params, ...result.data };
      }

      next();
    };
