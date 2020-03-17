import $ from 'jquery';
import JsMind from 'jsmind';
import 'jsmind/style/jsmind.css';

// prepare Dom

// plugin
export default {
  icon: '<path id="svg_1" d="m1024,256l0,-256l-384,0l0,96l-128,0l0,384l-64,0l0,-96l-448,0l0,256l448,0l0,-96l64,0l0,416l128,0l0,64l384,0l0,-256l-384,0l0,128l-64,0l0,-352l64,0l0,96l384,0l0,-256l-384,0l0,96l-64,0l0,-320l64,0l0,96l384,0zm-320,576l256,0l0,128l-256,0l0,-128zm0,-384l256,0l0,128l-256,0l0,-128zm0,-384l256,0l0,128l-256,0l0,-128z"/><rect id="svg_2" height="160.78792" width="298.04591" y="43.4601" x="681.61165" fill-opacity="null" stroke-opacity="null" stroke-width="null" stroke="null" fill="null"/><rect id="svg_3" height="174.51372" width="282.35928" y="429.74328" x="691.41579" fill-opacity="null" stroke-opacity="null" stroke-width="null" stroke="null" fill="null"/><rect id="svg_4" height="156.86627" width="300.00674" y="812.10481" x="681.61165" fill-opacity="null" stroke-opacity="null" stroke-width="null" stroke="null" fill="null"/>',
  handler(editor) {
    // prepare container
    const mindMapContainerId = 'mind_map_container';
    const mindMapContainer = $(`
        <div id="${mindMapContainerId}" style="
          position: fixed;
          left: 0px;
          right: 0px;
          top: 0px;
          bottom: 0px;
          background: rgba(251, 250, 249, 0.99);
          z-index: 200;
          overflow: auto;
        "> </div>
      `);
    mindMapContainer.on('click', (e) => {
      if (e.target.classList.contains('jsmind-inner') || e.target.classList.contains('theme-clouds')) {
        mindMapContainer.remove();
      }
    });
    $('body').append(mindMapContainer);

    // prepare data
    const data = buildMindMapData(editor.getHeadersHierarchy(), {
      id: 'root',
      isroot: true,
      topic: editor.fileServer.curFileDir,
      'background-color': '#aaa',
      'font-size': 16,
    });

    // create jsmind instance
    const jm = new JsMind({
      container: mindMapContainerId,
      theme: 'clouds',
      editable: false,
      view: {
        engine: 'svg',
      },
      shortcut: {
        enable: false,
      },
    });
    const mind = {
      meta: {
        version: '0.2',
      },
      format: 'node_array',
      data,
    };
    jm.show(mind);
    jm.view.zoomOut();
    jm.view.zoomOut();
    return false;
  }
};

// build mind map data
function buildMindMapData(hierarchy, root) {
  const data = [root];
  let i = 1;
  for (const node1 of hierarchy) {
    data.push({
      id: node1.lineNum + node1.text, parentid: 'root', topic: i + node1.text.replace(/#+/, ''), 'background-color': '#c7b29e',
    });
    i += 1;
    for (const node2 of node1.children) {
      data.push({
        id: node2.lineNum + node2.text, parentid: node1.lineNum + node1.text, topic: node2.text.replace(/#+/, ''), 'background-color': '#a2c5b4',
      });
      for (const node3 of node2.children) {
        data.push({
          id: node3.lineNum + node3.text, parentid: node2.lineNum + node2.text, topic: node3.text.replace(/#+/, ''), 'background-color': 'rgb(216, 196, 174)', expanded: false,
        });
        for (const node4 of node3.children) {
          data.push({
            id: node4.lineNum + node4.text, parentid: node3.lineNum + node3.text, topic: node4.text.replace(/#+/, ''), 'background-color': 'rgb(182, 216, 174)', expanded: false,
          });
          for (const node5 of node4.children) {
            data.push({
              id: node5.lineNum + node5.text, parentid: node4.lineNum + node4.text, topic: node5.text.replace(/#+/, ''), 'background-color': 'rgb(224, 195, 195)', expanded: false
            });
            for (const node6 of node5.children) {
              data.push({
                id: node6.lineNum + node6.text, parentid: node5.lineNum + node5.text, topic: node6.text.replace(/#+/, ''), 'background-color': '#ccc', expanded: false
              });
            }
          }
        }
      }
    }
  }
  return data;
}
