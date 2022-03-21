const {
  getListBySnippet,
  getListAndFillList,
  resetListAndFillList,
  getCurrentList,
} = require('./model');

/**
 * 常量模块
 */
const DEFAULTREP = {
  selStart: [0, 0],
  selEnd: [0, 0],
}

const mentionRef = {
  hide: () => {
    const inlineToolbar = $('#mention_container');
    /**
     * 添加淡入淡出效果
     * 动画完毕并且节点没有被移除之前，初始化数据相关
     * 1. 初始化-列表滚动到头部
     */
    inlineToolbar.animate({ 'opacity': '0', 'marginTop': '10px' }, 200, 'swing', function() {
      $('#inline_mention').scrollTop(0);
      inlineToolbar.css('display', 'none')
    })
    /**
     * 初始化mentionState.rep
     */
    mentionState.rep = {...DEFAULTREP };
    mentionState.mentionBubbled = false;
  },
  show: () => {
    const inlineToolbar = $('#mention_container');
    /**
     * 添加淡入淡出效果
     */
    inlineToolbar.css('display', 'block')
    inlineToolbar.animate({ 'opacity': '1', 'marginTop': '0' }, 200, 'swing')

    /**
     * 同步mention状态
     */
    mentionState.mentionBubbled = true;
  },
};

const mentionState = {
  /**
   * 当前是否满足mention_list弹出条件
   */
  mentionBubbled: false,
  /**
   * 触发mention弹窗时候的rep
   */
  rep: {
    ...DEFAULTREP,
  },
  /**
   * 模糊搜索text
   */
  searchText: '',
}

/**
 * 绑定编辑器相关自定义方法
 */
exports.aceInitialized = function(hook, context) {
  /**
   * 绑定填充mention信息方法
   * @remark 发送请求的话，这里是个不错的地方
   */
  var editorInfo = context.editorInfo;

  editorInfo.ace_fillWithMentionInfo = (info, selStart, selEnd) => {
    const {documentAttributeManager} = context;
    console.log('documentAttributeManager', documentAttributeManager)
    if (!info.mentionName) return;

    const newMention = [`mention-name:${info.mentionName}`, info.mentionName];
    documentAttributeManager.setAttributesOnRange(selStart, selEnd, [newMention]);
  }
}

/**
 * 初始化，绑定事件
 */
exports.postAceInit = (hookName, context) => {
  const padOuter = $('iframe[name="ace_outer"]').contents().find('body');
  const padOuterHTML = $('iframe[name="ace_outer"]').contents().find('html');
  const padInner = padOuter.contents('iframe').contents().find('body');

  const padOuterOffsetTop = $('iframe[name="ace_outer"]').offset().top;
  const innerOffsetLeft = padOuter.find('iframe').offset().left;
  const innerOffsetTop = padOuter.find('iframe').offset().top;
  const toolbar = $('#mention_container')

  /**
   * @postAceInit1
   * 绑定键盘事件，监听@ 的发生
   */
  context.ace.callWithAce((ace) => {
    ace.ace_setOnKeyDown((event) => {
      const { key, keyCode, altKey, shiftKey, metaKey, ctrlKey } = event.originalEvent;

      /**
       * @keyboard
       * 监听mention按键触发，计算光标位置
       */
      if (key === '@') {
        // console.log('event.currentTarget.createRange', event.currentTarget.createRange)
        // console.log('event.view', event.view.document.createRange)
        // console.log('event.view', event.view.getSelection())
        // console.log('event.view', event.view.selection.createRange)

        /**
         * 获取当前光标selection
         */
        const selection = event.view.getSelection();

        // console.log('selection', selection)
        // console.log('selection', selection.anchorNode)
        // console.log('selection', selection.anchorOffset)
        
        /**
         * 创建边界矩形，添加当前seleciton，计算当前光标位置
         * rangeEnd处理开头行及前方文字为空格的场景
         * @remark 这样的场景Rect无法正常创建，需借用at符号的位置，所以rangeEnd + 1;
         */

        const range = event.currentTarget.createRange();
        const rangeStart = selection.anchorOffset;
        const rangeEnd = selection.anchorOffset === 0 ? selection.anchorOffset + 1 : selection.anchorOffset

        range.setStart(selection.anchorNode, rangeStart)
        try {
          range.setEnd(selection.anchorNode, rangeEnd)

          const clientRect = range.getBoundingClientRect();

          toolbar.css({
            position: 'absolute',
            left: innerOffsetLeft + clientRect.x + 50,
            top: padOuterOffsetTop + innerOffsetTop + clientRect.y + 45 - padOuterHTML[0].scrollTop,
          });
        } catch(e) {
          range.setEnd(selection.anchorNode, rangeEnd - 1)

          const clientRect = range.getBoundingClientRect();

          toolbar.css({
            position: 'absolute',
            left: innerOffsetLeft + clientRect.x + 64,
            top: padOuterOffsetTop + innerOffsetTop + clientRect.y + 60 - padOuterHTML[0].scrollTop,
          });
        }

        /**
         * 展示mention弹窗
         */
        console.log('mention: 展示mention_list弹窗')
        mentionRef.show()

        /**
         * 记录当前rep位置, 更新mentionState
         * 值拷贝
         * @remark 记录的位置为@ 后一位，所以要 + 1
         */
        const { selStart, selEnd } = ace.ace_getRep();
        mentionState.rep.selStart = [selStart[0], selStart[1] + 1];
        mentionState.rep.selEnd = [selEnd[0], selEnd[1] + 1];

        /**
         * 重置mention_list数据
         */
        resetListAndFillList();

        return;
      }

      /**
       * @keyboard
       * 撤回操作监听, 兼容ctrl、command
       * 如果当前mention弹窗状态为展开，则关闭弹窗
       */

      if (!altKey && !shiftKey && key === 'z' && (metaKey || ctrlKey)) {
        if (mentionState.mentionBubbled) {
          mentionRef.hide();
        }
        return;
      }

      /**
       * @keyboard
       * 监听space
       * 当mention弹窗状态为展开，则关闭弹窗
       * @remark 输入法空格keyCode为229
       */
      if (keyCode === 32 && mentionState.mentionBubbled) {
        mentionRef.hide();
        return;
      };

      /**
       * @keyboard
       * 👼模糊搜索相关字段收集
       * 这里根据输入的值与光标的rep拆解allText来进行解析。
       * @remark mentionState.mentionBubbled
       */
      if (mentionState.mentionBubbled) {
        setTimeout(() => {
          const { selEnd: prevSelEnd } = mentionState.rep;
          const [, prevEndIndex] = prevSelEnd;
          const selEnd = ace.ace_getRep().selEnd;
          const [, endIndex] = selEnd;
          const repLineText = ace.ace_getRep().lines.atIndex(prevSelEnd[0]).text || '';

          const searchText = repLineText.substring(prevEndIndex - 1, endIndex);

          // console.log('ace', ace.ace_caretLine())
          // console.log('context', context)
          // console.log('event', event)

          /**
           * 判断是否需要隐藏弹窗
           * 调用模糊搜索函数，传入searchText
           * 保存一份到mentionState
           */
          if (!searchText.trim()) {
            mentionRef.hide();
          }
          
          getListBySnippet(searchText);

          mentionState.searchText = searchText;
        }, 200)
        
      }
    })

    /**
     * onKeyPress监听，进行按键拦截
     * 1、拦截Enter按键（keyCode13）
     */
    ace.ace_setOnKeyPress((event) => {
      const { keyCode } = event.originalEvent;
      /**
       * 如果mention弹窗存在才进行Enter拦截
       * 如果mention列表中无数据，则关闭弹窗
       * 如果mention列表中有数据，则进行数据填充
       * 
       * 上下左右按键的时候进行拦截（hold on）
       */
      if (mentionState.mentionBubbled && keyCode === 13) {
        const currentMentionList = getCurrentList();
        const isCurrentMentionListEmpty = currentMentionList.length === 0;
        if (isCurrentMentionListEmpty) {
          mentionRef.hide();
        } else {
          // 目前只插入第一个，当做上下按键拦截的时候，再来修改这里。
          insertMentionInfoToAce({ mentionName: currentMentionList[0] })

          mentionRef.hide();
        }
        return false;
      }
      return true;
    });
  });

  /**
   * @postAceInit2
   * mention_list点击事件代理
   */
  $('#inline_mention').delegate('li', 'click', function() {
    /**
     * 获取点击的人名及相关信息
     */
    const mentionName = $(this).text();
    
    insertMentionInfoToAce({ mentionName })

    mentionRef.hide();
  });

  /**
   * @method 将mention相关信息插入到@ 符号后面
   * 1、替换@ 后面文字
   * 2、计算需要转变的新rep范围
   * 3、添加自定义Attribute
   * 4、关闭弹窗
   * 5、模糊搜索中的key关键字范围也需覆盖
   */
  insertMentionInfoToAce = (info = {}) => {
    const mentionInfo = {
      mentionName = '',
      ...info,
    }

    context.ace.callWithAce((ace) => {
      const rep = ace.ace_getRep();
      const { selEnd } = rep;

      const { selStart: prevSelStart, selEnd: prevSelEnd } = mentionState.rep;

      ace.ace_performDocumentReplaceRange(prevSelStart, selEnd, mentionInfo.mentionName + ' ')
      
      const mentionSelStart = [prevSelStart[0], prevSelStart[1] - 1];
      const mentionSelEnd = [prevSelEnd[0], prevSelEnd[1] + mentionInfo.mentionName.length];

      ace.ace_fillWithMentionInfo(mentionInfo, mentionSelStart, mentionSelEnd)

    }, 'insertMention', true)
  }

  /**
   * @postAceInit3
   * mention模块全局点击事件委托
   * @description unuse
   */
  padInner.delegate('.mention-name', 'click', function() {
    console.log('mention[click]:', $(this).text());
    return false;
  })

  /**
   * @postAceInit4
   * 🐭鼠标事件边界处理
   * 编辑器外鼠标点击，判断mention弹窗是否展示
   * 如果mention弹窗展示则关闭mention弹窗
   */
  padOuter.on('mouseup', (e) => {
    mentionRef.hide();
  });

  /**
   * @postAceInit5
   * 🐭鼠标事件边界处理
   * 编辑器内鼠标点击，判断落点与@ 符号记录的位置是否相同
   * 如果落点不同，则关闭弹窗
   * 如果落点相同，则不做拦截
   */
  padInner.on('mouseup', (e) => {
    const prevRep = mentionState.rep;
    context.ace.callWithAce((ace) => {
      const { selStart, selEnd } = ace.ace_getRep();
      const isSameSelStart = prevRep.selStart.toString() === selStart.toString()
      const isSameSelEnd = prevRep.selEnd.toString() === selEnd.toString()
      if (!isSameSelStart || !isSameSelEnd) {
        mentionRef.hide();
      }
    }, '', true)
  });

  /**
   * @postAceInit6
   * 填充mention_list数据
   */
  getListAndFillList();
}

/**
 * 行内属性转为Class
 */
exports.aceAttribsToClasses = (name, context) => {
  // console.log('mention[aceAttribsToClasses-context]:', context)
  const res = /(?:^| )mention-name:([\u4e00-\u9fa5_a-zA-Z0-9]*)/.exec(context.key) || [];
  const [mentionPrefix = '', mentionName] = res;

  if (mentionPrefix.indexOf('mention-name:') > -1 && mentionName) {
    return [`mention-name:${mentionName}`];
  }
};

/**
 * 根据Class(cls)创建新DOM
 */
exports.aceCreateDomLine = (hookName, context) => {
  const cls = context.cls;
  const res = /(?:^| )mention-name:([\u4e00-\u9fa5_a-zA-Z0-9]*)/.exec(cls) || [];
  const [, sizesType] = res;
  if (sizesType == null) return [];
  return [{
    extraOpenTags: '<a class="mention-name" draggable="false" contenteditable="false" href="javascript:void(0)">',
    extraCloseTags: '</a>',
    cls,
  }];
};

exports.acePostWriteDomLineHTML = function (hook_name, args, cb) {
}

exports.aceEditorCSS = () => ['ep_mention_plugin/static/css/style.css'];

exports.aceEditEvent = function(hookName, call) {
  // If it's not a click or a key event and the text hasn't changed then do nothing
  const cs = call.callstack;
  if (!(cs.type === 'handleClick') && !(cs.type === 'handleKeyEvent') && !(cs.docTextChanged)) {
    return false;
  }
  // If it's an initial setup event then do nothing..
  if (cs.type === 'setBaseText' || cs.type === 'setup') return false;
  // console.log(cs)
}

// exports.acePostWriteDomLineHTML = function(hookName, context, cls, xxx) {
//   console.log('acePostWriteDomLineHTML', hookName, context, cls, xxx)
// }

// exports.aceDomLineProcessLineAttributes = function(hookName, context, cls) {
//   console.log('aceDomLineProcessLineAttributes', hookName, context, cls)
//   return {
//     preHtml: '',
//     postHtml: '',
//     processedMarker: false, 
//   }
// }


