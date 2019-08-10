export default function (editor) {
  let isActive = false;
  const { cm } = editor;
  if (cm.isReadOnly()) {
    cm.setOption('readOnly', false);
    isActive = false;
  } else {
    cm.setOption('readOnly', 'nocursor');
    isActive = true;
  }
  return isActive;
}
