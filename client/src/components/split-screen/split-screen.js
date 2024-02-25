export default {
  icon: ' <path stroke="null" id="svg_1" d="m819.8121,41.64219l-623.7407,0c-106.86873,0 -161.34438,52.9192 -161.34438,159.2618l0,272.31249l945.92526,0l0,-272.31249c0,-105.8384 -53.44532,-159.2618 -160.84018,-159.2618zm-623.7407,945.8814l623.7407,0c107.39485,0 160.81825,-53.42341 160.81825,-159.2618l0,-273.86893l-945.8814,0l0,273.89084c0,106.3426 54.45372,159.2618 161.34438,159.26181l-0.02193,-0.02193z"/>',
  handler(editor, isActive, vueComp) {
    const newSplitScreenMode = (vueComp.$store.state.splitScreenMode + 1) % 2;
    if (newSplitScreenMode) {
      editor.messager.success(`分屏模式 ${newSplitScreenMode}, 再次点击切换布局`);
    } else {
      editor.messager.success('关闭分屏 ');
    }
    vueComp.$store.commit('updateSplitScreenMode', newSplitScreenMode);
    return {
      0: false,
      1: '上下分屏',
      2: '左右分屏'
    }[newSplitScreenMode];
  },
};
