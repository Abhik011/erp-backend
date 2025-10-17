// helpers/idGenerator.js
const pad = (n, len = 3) => String(n).padStart(len, "0");

/**
 * Get the next sequential ID for a model.
 *
 * @param {mongoose.Model} model  – the Mongoose model to query
 * @param {string}         prefix – e.g. "CRS", "DEP", "SUB"
 * @returns {Promise<string>}     – e.g. "CRS2025-007"
 */
module.exports = async function nextId(model, prefix) {
  const year  = new Date().getFullYear();           // 2025
  const base  = `${prefix}${year}`;                 // CRS2025
  const regex = new RegExp(`^${base}-\\d{3}$`);

  // find the highest existing ID for the same year
  const last = await model.find({ id: regex })
                          .sort({ id: -1 })
                          .limit(1)
                          .lean();

  const seq = last.length
    ? parseInt(last[0].id.split("-")[1], 10) + 1
    : 1;

  return `${base}-${pad(seq)}`;                     // "CRS2025-001"
};
