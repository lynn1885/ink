import $ from 'jquery';
import JsMind from 'jsmind';
import 'jsmind/style/jsmind.css';

// prepare Dom
const mindMapContainerId = 'mind_map_container';
let mindMapContainer;

// plugin
export default {
  icon: '<path d="M1024 256v-256h-384v96h-128v384h-64v-96h-448v256h448v-96h64v416h128v64h384v-256h-384v128h-64v-352h64v96h384v-256h-384v96h-64v-320h64v96h384z m-320 576h256v128h-256v-128z m0-384h256v128h-256v-128z m0-384h256v128h-256v-128z" p-id="5408"></path>',
  handler(editor, lastStatus) {
    // prepare
    let isActive;

    if (lastStatus) { // close
      isActive = false;
      mindMapContainer.remove();
    } else { // open
      isActive = true;
      mindMapContainer = $(`
        <div id="${mindMapContainerId}" style="
          position: fixed;
          left: 44px;
          right: 0px;
          top: 0px;
          bottom: 24px;
          background: rgba(251, 250, 249, 0.95);
          z-index: 200;
          overflow: auto;
        "> </div>
      `);
      $('body').append(mindMapContainer);
      // ❌ getHeadersHierarchy的api已经改动了
      const data = buildMindMapData(editor.getHeadersHierarchy(null, true), { id: 'root', isroot: true, topic: '' });
      const jm = new JsMind({
        container: mindMapContainerId,
        theme: 'info',
        editable: false,
      });
      const mind = {
        meta: {
          version: '0.2',
        },
        format: 'node_array',
        data,
      };
      jm.show(mind);
    }

    // return
    return isActive;
  },
};

// build mind map data
function buildMindMapData(hierarchy, root) {
  const data = [root];
  // eslint-disable-next-line no-restricted-syntax
  for (const lv1Name in hierarchy) {
    data.push({
      id: lv1Name, parentid: 'root', topic: lv1Name.replace(/\d+?\s/, ''), 'background-color': '#963607',
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const lv2Name in hierarchy[lv1Name]) {
      data.push({
        id: lv2Name, parentid: lv1Name, topic: lv2Name.replace(/\d+?\s/, ''), 'background-color': '#339966',
      });
      // eslint-disable-next-line no-restricted-syntax
      for (const lv3Name in hierarchy[lv1Name][lv2Name]) {
        data.push({
          id: lv3Name, parentid: lv2Name, topic: lv3Name.replace(/\d+?\s/, ''), 'background-color': '#997B57',
        });
        // eslint-disable-next-line no-restricted-syntax
        for (const lv4Name in hierarchy[lv1Name][lv2Name][lv3Name]) {
          data.push({
            id: lv4Name, parentid: lv3Name, topic: lv4Name.replace(/\d+?\s/, ''), 'background-color': '#809174',
          });
          // eslint-disable-next-line no-restricted-syntax
          for (const lv5Name in hierarchy[lv1Name][lv2Name][lv3Name][lv4Name]) {
            data.push({
              id: lv5Name, parentid: lv4Name, topic: lv5Name.replace(/\d+?\s/, ''), 'background-color': '#B2867B',
            });
            // eslint-disable-next-line no-restricted-syntax
            for (const lv6Name in hierarchy[lv1Name][lv2Name][lv3Name][lv4Name][lv5Name]) {
              data.push({
                id: lv6Name, parentid: lv5Name, topic: lv6Name.replace(/\d+?\s/, ''), 'background-color': '#aaa',
              });
            }
          }
        }
      }
    }
  }
  return data;
}
