export default {
  icon: '<path stroke="null" id="svg_1" p-id="1245" d="m119.03186,142.12983c-9.19432,0 -18.38863,10.85731 -18.38863,21.71462l0,655.05772l-52.10113,0c-18.38863,0 -36.77727,-18.09552 -36.77727,-43.42924l0,-694.86785c0,-25.33372 15.32386,-43.42924 36.77727,-43.42924l750.8692,0c18.38863,0 36.77727,18.09552 36.77727,43.42924l0,65.14386l-717.15671,0l0,-3.6191zm796.84078,61.52476l36.77727,0c18.38863,0 36.77727,18.09552 36.77727,43.42924l0,694.86785c0,21.71462 -15.32386,43.42924 -36.77727,43.42924l-753.93397,0c-18.38863,0 -33.71249,-18.09552 -33.71249,-43.42924l0,-738.29709l750.8692,0c0,0 0,0 0,0z"/>',
  handler(editor, isActive, vueComp) {
    const newSplitScreenMode = (vueComp.$store.state.splitScreenMode + 1) % 3;
    if (newSplitScreenMode) {
      editor.messager.success(`分屏模式 ${newSplitScreenMode}, 再次点击切换布局`);
    } else {
      editor.messager.success('关闭分屏 ');
    }
    vueComp.$store.commit('updateSplitScreenMode', newSplitScreenMode);
    return false;
  },
};
