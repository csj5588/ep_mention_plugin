'use strict';

const eejs = require('ep_etherpad-lite/node/eejs/');

exports.eejsBlock_editbarMenuLeft = (hookName, args, cb) => {
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

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  // args.content =
  //   '<script src="https://unpkg.com/@popperjs/core@2/dist/umd/popper.min.js"></script>' +
  //   '<script src="https://unpkg.com/tippy.js@6/dist/tippy-bundle.umd.js"></script>' + args.content;
}
