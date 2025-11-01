import Joi from 'joi';

const rookie_salaries_schema = Joi.object()
  .pattern(
    Joi.string().regex(/^\d+$/), // whole numbers
    Joi.number().min(1)
  )
  .required();

const league_validation_schema = Joi.object({
  sleeper_league_id: Joi.string().required(),

  salary_cap: Joi.number().required(),

  rookie_contract_length: Joi.number()
    .valid(1, 2, 3, 4)
    .required()
    .default(3),

  auction_contract_length: Joi.number()
    .valid(1, 2, 3, 4)
    .required()
    .default(3),

  max_extension_length: Joi.number()
    .valid(1, 2, 3, 4)
    .required()
    .default(3),

  extension_price_hike: Joi.number()
    .min(0)
    .required()
    .default(10),

  rookie_salaries: rookie_salaries_schema.default({
    1: 9,
    2: 5,
    3: 3
  })
});

export default league_validation_schema;