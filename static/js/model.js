const { listMock } = require('./constant');

/**
 * 根据关键字模糊搜索
 * 目前使用listMock，还没有联调接口
 * @param {String} snippet 关键字片段
 */
exports.getListBySnippet = function(snippet = '') {
  console.log('snippet', snippet)

  if (!snippet) return;

  const snippetKey = snippet.substring(1);
  const filterList = listMock.filter(item => item.indexOf(snippetKey) > -1);

  $('#inline_mention').empty();

  /**
   * 判断fliterList是否为空
   * 如果为空，则填充empty数据
   * 如果不为空，填充mention_list
   */
  const isFilterListEmpty = filterList.length === 0;
  if (isFilterListEmpty) {
    fillEmptyMentionList();
  } else {
    fillMentionList(filterList);
  }
}

/**
 * 获取mention_list初始数据并填充
 * @remark 这里应该还有缓存策略
 */
exports.getListAndFillList = function() {
  fillMentionList(listMock);
}

/**
 * 重置mention_list数据
 */
exports.resetListAndFillList = function() {
  $('#inline_mention').empty();
  fillMentionList(listMock);
}

/**
 * 根据data列表填充mention_list
 */
const fillMentionList = function(data) {
  console.log('data', data)
  data.forEach(item => {
    $('#inline_mention').append(`<li>${item}</li>`);
  });
}

/**
 * mention_list填充空数据
 */
const fillEmptyMentionList = function() {
  $('#inline_mention').append(`<p class="mention-list-empty-text">暂无数据～</p>`);
}