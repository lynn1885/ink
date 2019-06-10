const UserConfig = require('../models/user-config');

/**
 * get: 获取用户配置
 */
exports.get = async (req, res) => {
  let props;
  if (req.query && req.query.props) ({ props } = req.query);
  await UserConfig.getMergedConfig(props)
    .then((data) => {
      res.send(JSON.stringify(data));
    })
    .catch((err) => {
      console.log('[config] get default & user config');
      res.status(500).json(err);
      console.error(err);
    });
};
