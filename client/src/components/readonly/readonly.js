export default {
  icon: '<path stroke="null" transform="rotate(22.609697341918945 560.8153076171869,512.9096679687502) " d="m574.40574,999.05181l-4.87199,0a502.30187,502.30187 0 0 1 -357.60386,-153.4676a509.60986,509.60986 0 0 1 -12.66716,-682.07821a493.5323,493.5323 0 0 1 194.87948,-133.49244a48.71988,48.71988 0 0 1 51.64307,10.71836a48.71988,48.71988 0 0 1 11.69277,48.71988a409.24692,409.24692 0 0 0 94.51655,429.22207a412.65732,412.65732 0 0 0 430.19647,94.51656a48.71988,48.71988 0 0 1 61.87424,62.84863a494.99389,494.99389 0 0 1 -114.0045,176.85313a500.84028,500.84028 0 0 1 -355.65507,146.15962z" id="svg_1"/>',
  handler(editor) {
    let isActive = false;
    const { cm } = editor;
    if (cm.isReadOnly()) {
      cm.setOption('readOnly', false);
      isActive = false;
      editor.messager.warning('退出只读模式');
    } else {
      cm.setOption('readOnly', 'nocursor');
      isActive = true;
      editor.messager.warning('进入只读模式');
    }
    return isActive;
  },
};
