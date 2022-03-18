'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');

exports.eejsBlock_editbarMenuLeft = (hookName, args, cb) => {
  // console.log('hookName', hookName, args, cb)
  // args.content += eejs.require('ep_mention_plugin/templates/editbarButtons.ejs');
  // args.content += eejs.require('ep_mention_plugin/templates/chartbarButtons.ejs');
  return cb();
};

exports.eejsBlock_body = (hookName, args, cb) => {
  args.content += eejs.require('ep_mention_plugin/templates/mentionList.ejs');
  cb();
};

/**
 * 插入mention插件样式
 */
exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content = require('ep_etherpad-lite/node/eejs/').require("ep_mention_plugin/templates/style.ejs") + args.content;
}
