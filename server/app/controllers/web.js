const Web = require('../models/web');

// get images
exports.get = async (req, res) => {
  if (!req.query || !req.query.url) {
    res.status(400).send('错误的url参数');
    return;
  }

  const website = await Web.getWebsite(String(req.query.url));

  res.send(website);
};
