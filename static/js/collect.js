
exports.collectContentPre = (hookName, context) => {
  // console.log('collectContentPre', context)
  const size = /(?:^| )mention-name:([\u4e00-\u9fa5_a-zA-Z0-9]*)/.exec(context.cls);
  // console.log('collectContentPre', context, size)
  if (size && size[1]) {
    context.cc.doAttrib(context.state, `mention-name:${size[1]}`);
  }
};

exports.collectContentImage = function(name, context){
  // console.log('collectContentImage', context)
  // context.state.lineAttributes.img = context.node.outerHTML;
}

exports.collectContentPost = function(name, context){
  // console.log('collectContentPost', context)
  // context.state.lineAttributes.img = context.node.outerHTML;
}

exports.collectContentLineText = (hookName, context) => {
  // context.text = tweakText(context.text);
  // console.log('collectContentLineText', context)
};