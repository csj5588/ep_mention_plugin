/**
 * 计算当前行，也可以计算下一行
 * @param {ace} ace 编辑器实例
 */
const _handleNewLines = (ace) => {
  const rep = ace.ace_getRep();
  const lineNumber = rep.selStart[0];
  const curLine = rep.lines.atIndex(lineNumber);
  if (curLine.text && curLine.text !== '*') {
    // ace.ace_doReturnKey();

    return lineNumber + 1;
  }

  return lineNumber;
};