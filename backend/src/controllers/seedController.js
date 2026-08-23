const { initAdminAndInfrastructure } = require('../utils/initAdmin');

/**
 * Production safe endpoint:
 * Only ensures Administrator and required taxonomy exist without resetting or creating test/demo data.
 */
const seedDatabase = async (req, res) => {
  try {
    await initAdminAndInfrastructure();
    return res.status(200).json({ 
      message: 'System infrastructure and taxonomy verified in clean production state.',
      success: true 
    });
  } catch (error) {
    console.error('Infrastructure init error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  seedDatabase
};
