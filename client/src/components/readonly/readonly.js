export default function (editor) {
  const res = {
    isActive: false,
  };
  const { cm } = editor;
  if (cm.isReadOnly()) {
    cm.setOption('readOnly', false);
    res.isActive = false;
  } else {
    cm.setOption('readOnly', 'nocursor');
    res.isActive = true;
  }
  return res;
}
