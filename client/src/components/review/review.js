export default {
  icon: '<path stroke="null" id="svg_1" d="m900.82839,32.27042l-389.96479,0l0,70.90269l106.35403,0l0,70.90269l-106.35403,0l0,70.90269l106.35403,0l0,70.90269l-106.35403,0l0,70.90269l106.35403,0l0,310.19927c0,14.67907 -11.90944,26.58851 -26.58851,26.58851l-159.53105,0c-14.67907,0 -26.58851,-11.90944 -26.58851,-26.58851l0,-239.29658l106.35403,0l0,-70.90269l-106.35403,0l0,-70.90269l106.35403,0l0,-70.90269l-106.35403,0l0,-70.90269l106.35403,0l0,-70.90269l-106.35403,0l0,-70.90269l-283.61076,0c-48.94501,0 -88.62836,39.68335 -88.62836,88.62836l0,779.92958c0,48.94501 39.68335,88.62836 88.62836,88.62836l779.92958,0c48.94501,0 88.62836,-39.68335 88.62836,-88.62836l0,-779.92958c0,-48.94501 -39.68335,-88.62836 -88.62836,-88.62836z"/>',
  handler(editor, lastStatus, vueThis) {
    // prepare
    const reviewPathArr = ['.ink', 'basic', 'review']; // ⚠️ hard-coded, terrible
    const reviewMark = 'Review:';

    // calculate new note
    const oriNote = editor.cm.getValue();
    const oriNoteArr = oriNote.split('\n');
    const newNoteArr = [];
    let isOpenPush = false;
    let lineNum = 0;
    const curReviewHeader = {
      lv: 999,
      lineNum: 9999999,
    };
    const pushedHeaderLineNums = new Set();

    for (const text of oriNoteArr) {
      let isThisLinePushed = false;
      // close add
      const curLineHeaderLv = editor.isThisTextAHeader(text);
      if (curLineHeaderLv && curLineHeaderLv <= curReviewHeader.lv) {
        isOpenPush = false;
      } else if (text.startsWith(reviewMark)) { // add headers
        isOpenPush = true;
        const ancHeaders = editor.getHeaderAncestors({ line: lineNum, ch: 0 }).reverse();
        const ancHeaderLineNums = [];
        for (const h of ancHeaders) {
          if (!pushedHeaderLineNums.has(h.headerLineNum)) {
            newNoteArr.push(h.headerLineText);
            isThisLinePushed = true;
            pushedHeaderLineNums.add(h.headerLineNum);
          }
          ancHeaderLineNums.push(h.headerLineNum);
        }
        // update curReviewHeader
        const prevHeaderLv = ancHeaders[ancHeaders.length - 1].headerLv;
        if (prevHeaderLv < curReviewHeader.lv || !ancHeaderLineNums.includes(curReviewHeader.lineNum)) {
          curReviewHeader.lv = prevHeaderLv;
          curReviewHeader.lineNum = ancHeaders[ancHeaders.length - 1].headerLineNum;
        }
      }
      // add un-headers
      if (isOpenPush && !isThisLinePushed) {
        newNoteArr.push(text);
      }
      lineNum += 1;
    }
    const newNote = newNoteArr.join('\n');
    const oriNoteWordCount = editor.getWordAndLineCount(oriNote).wordCount;
    const newNoteWordCount = editor.getWordAndLineCount(newNote).wordCount;

    // fix old tab
    const oldPath = `${vueThis.$store.state.curFilePath.split('/').slice(0, 3).join('/')}/`;
    editor.quickOpenBar.fixThisNoteDir(oldPath);

    // goto review note
    vueThis.$store.commit('updateGotoThisCatalog', reviewPathArr);

    // set reivew note value when open
    const unwatch = vueThis.$watch(
      '$store.state.curFilePath',
      (value) => {
        unwatch();
        if (value === `${reviewPathArr.join('/')}/${reviewPathArr[reviewPathArr.length - 1]}.md`) {
          editor.cm.getDoc().setValue(`# 原文: ${oldPath}, 压缩至: ${((newNoteWordCount / oriNoteWordCount) * 100).toFixed(2)}%, 原文字数: ${oriNoteWordCount}, 复习字数: ${newNoteWordCount}\n${newNote} \n`);
        }
      },
    );

    return false;
  },
};
