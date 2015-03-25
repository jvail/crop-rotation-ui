
var CropRotationUi = function (divSelector, options) {

  var DEBUG = true
    , crops = options.crops
    , rotationUi = $(divSelector)
    , MAX_ROTATION_LENGTH = options.maxRotationLength || 5
    , MAX_DROPS_PER_CROP = 3
    , MAX_DRAGS_PER_CROP = 3
    , MAX_CROPS_PER_YEAR = 3
    , MAX_CROPS_1ST_YEAR = 1
    , noYears = 1
    , colors = options.colors || 
      ['rgb(33, 113, 181)',
      'rgb(35, 139, 69)',
      'rgb(200, 200, 5)',
      'rgb(203, 24, 29)',
      'rgb(204, 76, 2)',
      'rgb(106, 81, 163)',
      'rgb(206, 18, 86)',
      'rgb(164, 46, 46)']
    , well = $('<div id="well"></div>').appendTo(rotationUi)
    , main = $('<div id="main"></div>').appendTo(rotationUi)
    , edit = $('<div id="edit"><span id="crop-name" style="margin: 5px;"></span></div>').appendTo(rotationUi)
    ;

  rotationUi.addClass('crop-rotation');

  for (var c = 0, cs = crops.length; c < cs; c++) {
    var crop = crops[c];
    var color = colors[c];
    $("<div class='well-item' data-crop='"+crop.name+"'>\
        <div class='item-header'>\
          <span class='item-label'>"+crop.name+"</span>\
          <span class='ui-icon ui-icon-close'></span>\
        </div>\
      </div>"
    ).appendTo(well).find('.item-header').css('background-color', color + ' !important');
  }

  var widthMain = parseInt(main.css('width'));
  var heightMain = parseInt(main.css('height'));

  var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
  svg.setAttributeNS(null, 'width', '100%');
  svg.setAttributeNS(null, 'height', '100%');
  svg.setAttributeNS(null, 'stroke-width', 0);
  svg.setAttributeNS(null, 'fill', '#333');
  main.append(svg);

  var rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
  rect.setAttributeNS(null, 'x', 0);
  rect.setAttributeNS(null, 'y', 0);
  rect.setAttributeNS(null, 'width', '100%');
  rect.setAttributeNS(null, 'height', '100%');
  rect.setAttributeNS(null, 'stroke-width', 0);
  rect.setAttributeNS(null, 'fill', '#333');
  svg.appendChild(rect);

  for (var y = 0; y < MAX_ROTATION_LENGTH; y++) {
    var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
    line.setAttributeNS(null, 'x1', (y + 1) * widthMain / (MAX_ROTATION_LENGTH + 1));
    line.setAttributeNS(null, 'x2', (y + 1) * widthMain / (MAX_ROTATION_LENGTH + 1));
    line.setAttributeNS(null, 'y1', 0);
    line.setAttributeNS(null, 'y2', heightMain);
    line.setAttributeNS(null, 'stroke-dasharray', '3,3');
    line.style.stroke = "rgb(40,40,40)"; //Set stroke colour
    line.style.strokeWidth = "0.4"; //Set stroke width
    line.style.fill = "rgba(0, 0, 0, 0)"; //Set stroke width
    svg.appendChild(line);
  }

  var previewConnection = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  previewConnection.setAttributeNS(null, 'id', 'preview-connection');
  previewConnection.setAttributeNS(null, 'stroke-dasharray', '3,3');
  previewConnection.style.stroke = "#aaa"; //Set stroke colour
  previewConnection.style.strokeWidth = "1.5"; //Set stroke width
  previewConnection.style.fill = "rgba(0, 0, 0, 0)"; //Set stroke width
  previewConnection.style.opacity = 0; //Set stroke width
  previewConnection.setAttributeNS(null, "d",'M 0 0 C 0 0 0 0 0 0');
  svg.appendChild(previewConnection);

  for (var y = 0; y < MAX_ROTATION_LENGTH; y++)
    main.append("<div class='container'></div>");
  
  main.append("<div class='container no-drop'></div>");
  
  $('.container', main).css({
    width: widthMain / (MAX_ROTATION_LENGTH + 1),
    height: heightMain
  });

  $(window).resize(function () {

    widthMain = parseInt(main.css('width'));
    heightMain = parseInt(main.css('height'));

    if (widthMain / (MAX_ROTATION_LENGTH + 1) <= 100)
      return;
    
    $('.container', main).css({
      width: widthMain / (MAX_ROTATION_LENGTH + 1) + 'px',
      height: heightMain + 'px'
    });

    $('line', svg).each(function (index) {
      $(this)[0].setAttributeNS(null, 'x1', (index + 1) * widthMain / (MAX_ROTATION_LENGTH + 1));
      $(this)[0].setAttributeNS(null, 'x2', (index + 1) * widthMain / (MAX_ROTATION_LENGTH + 1));
    });

    $('.item', main).each(function (index) {
      $(this).css('left', ((widthMain / (MAX_ROTATION_LENGTH + 1)) - parseInt($(this).css('width'))) * 0.5);
    });

    connections.update();

  });


  /*
    allowed: n -> 1, 1 -> n
    not allowed: n -> n,m
  */

  var connections = (function (svg) {

    var store = [], svg = svg;

    var add = function (connection) {

      var path = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
      path.setAttributeNS(null, 'class', 'connector');
      path.style.stroke = "#aaa"; //Set stroke colour
      path.style.strokeWidth = "1px"; //Set stroke width
      path.style.fill = "transparent"; //Set stroke width
      path.setAttributeNS(null, "d",'M0 0 C 0 0 0 0 0 0'); //Set path's data
      svg.appendChild(path);
      connection.path = path;
      store.push(connection);
      redraw(connection);

      return path;

    };

    var redraw = function (connection) {

      var path = connection.path
        , offsetFrom = connection.from.ui.offset()
        , offsetTo = connection.to.ui.offset()
        , ptFrom  = svg.createSVGPoint()
        , ptTo  = svg.createSVGPoint()
        ;

      ptFrom.x = offsetFrom.left + connection.from.ui.width();
      ptFrom.y = offsetFrom.top + connection.from.ui.height() * 0.5;
      ptFrom = ptFrom.matrixTransform(svg.getScreenCTM().inverse());

      ptTo.x = offsetTo.left;
      ptTo.y = offsetTo.top + connection.to.ui.height() * 0.5;
      ptTo = ptTo.matrixTransform(svg.getScreenCTM().inverse());

      path.pathSegList[0].x = ptFrom.x;
      path.pathSegList[0].y = ptFrom.y;
      path.pathSegList[1].x = ptTo.x;
      path.pathSegList[1].y = ptTo.y;
      path.pathSegList[1].x1 = path.pathSegList[1].x2 = ptFrom.x + (ptTo.x - ptFrom.x) * 0.5;      
      path.pathSegList[1].y1 = ptFrom.y;
      path.pathSegList[1].y2 = ptTo.y;
    
    };

    var update = function (item) {

      for (var i = 0, is = store.length; i < is; i++) {
        var connection = store[i];
        if (item === undefined) {
          redraw(connection); // update all items
        } else {
          if (connection.from.ui.parents('.item').is(item) || connection.to.ui.parents('.item').is(item))
            redraw(connection);
        }
      }

    };

    var remove = function (path) {

      if (!path) {
        clear();
      } else {

        for (var i = 0, is = store.length; i < is; i++) {

          if (store[i].path === path) {

            var connection = store.splice(i, 1)[0];
            $(connection.path).remove();
            if (store.length === is - 1)
              return connection;
            break;
          }

        }

        return null;
      
      }

    };

    var clear = function (path) {

      $('.connector', svg).remove();
      store = [];

    };

    var get = function () {

      var rotation = [], from = null, to = null, containerIndex = 0;

      for (var i = 0, is = store.length; i < is; i++) {

        from = store[i].from.ui.parents('.item').data('data');
        to = store[i].to.ui.parents('.item').data('data');
        containerIndex = from.containerIndex;

        if (rotation[containerIndex] === undefined) {
          rotation[containerIndex] = [{
            crop: from.crop,
            id: from.id,
            to: [to.id]
          }];
        } else {
          var exists = rotation[containerIndex].filter(function (e) { return e.id === from.id; });
          if (exists[0]) {
            exists[0].to.push(to.id);
          } else {
            rotation[containerIndex].push({
              crop: from.crop,
              id: from.id,
              to: [to.id]
            });
          }
        }

      }

      return rotation;

    };


    return {
      get: get,
      add: add,
      update: update,
      remove: remove
    };


  }(svg));

  var updateRotationLength = function () {

    $('line', svg).each(function () { this.style.stroke = 'rgb(153, 153, 153)'; });

    // find last container that is empty, contains no items
    var container = $('.container', main);
    noYears = container.length - 1;
    for (var i = container.length - 2; i >= 0; i--) {
      if ($(container[i]).find('.item').length === 0)
        noYears = i;
      else
        break;
      $('line', svg)[i].style.stroke = 'rgb(40, 40, 40)';
    }

    if (DEBUG)
      console.log('updateRotationLength to: ' + noYears);

  }

  var itemDropAllowed = function (container) {

    var containerIndex = $('.container', main).index(container);

    // only one item in first year allowed
    if (containerIndex === 0 && container.children('.item').length >= MAX_CROPS_1ST_YEAR)
      return false;

    // max 3 items per container
    if (containerIndex > 0 && container.children('.item').length >= MAX_CROPS_PER_YEAR)
      return false

    // if last crop (clone) has drops rotation length is locked
    var lastItem = $('.container:last()', main).find('.item');
    if (containerIndex > 0 && lastItem.length > 0 && lastItem.data('data').drops.length > 0 && containerIndex + 1 > noYears)
      return false;

    return true;

  }; 

  var connectionAllowed = function (drag, drop) {

    var dragData = drag.parents('.item').data('data');
    var dropData = drop.parents('.item').data('data');

    // check if max. no. of precrops has been reached
    if (dropData.drops.length === MAX_DROPS_PER_CROP) {
      if (DEBUG) console.log('max. no. of precrops has been reached');
      return false;
    }

    // avoid n:m connections
    if (dropData.drops.length > 0 && dropData.drags.length > 1) {
      if (DEBUG) console.log('avoid n:m connections');
      return false;        
    }

    // allow only connections from previous period (container)
    if (dropData.containerIndex - 1 !== dragData.containerIndex) {

      // .. but allow if it is the last crop in a rotation
      if (dropData.containerIndex === $('.container', main).length - 1)  { // is clone of first
        var index = dragData.containerIndex;
        var isLastCrop = true;
        while (index < $('.container', main).length - 2) {

          index++;
          if ($($('.container', main)[index]).children('.item').length !== 0) {
            isLastCrop = false;
            break;
          }

        };

        if (isLastCrop)
          return true;
      }

      if (DEBUG) console.log('only connections from previous period (container) allowed');
      return false;
    }

    var hasAlreadyConnectionToItem = false;
    var dragItem = drag.parents('.item');
    for (var i = 0, is = dropData.drops.length; i < is; i++) {
      if (dropData.drops[i].from.item.is(dragItem)) {
        hasAlreadyConnectionToItem = true;
        break;
      }
    }

    // check if drop is allowed
    if (hasAlreadyConnectionToItem) {
      if (DEBUG) console.log('items already connected')
      return false;
    }

    return true;

  };

  var updateArea = function (dragItem) {

    var area = 0;

    if (dragItem.data('data').containerIndex === noYears) {
      // compare start & end area
      area = dragItem.data('data').drops.reduce(function (p, c) {
        return { area: p.area + c.area };
      }, { area: 0 }).area;
      
      if (area !== dragItem.data('data').clone.data('data').area)
        dragItem.find('.item-drop-area').css('color', 'red');
      else
        dragItem.find('.item-drop-area').css('color', 'black');

      return;
    }

    if (dragItem.data('data').containerIndex === 0) {

      area = dragItem.data('data').area;

    } else {

      area = dragItem.data('data').drops.reduce(function (p, c) {
        return { area: p.area + c.area };
      }, { area: 0 }).area;

      if (dragItem.data('data').drops.length === 0 || area === 0) {
        dragItem.find('.item-drop-area').html(0);
        dragItem.find('.item-drop-area').css('color', 'red');
      } else {
        dragItem.find('.item-drop-area').css('color', 'black');
      }

    }

    dragItem.find('.item-drop-area').html(area.toFixed(2));

    
    var draggedArea = area / dragItem.data('data').drags.length;

    for (var i = 0, is = dragItem.data('data').drags.length; i < is; i++) {

      var dropItem = dragItem.data('data').drags[i].to.item;

      if (dropItem.data('data').drops.length === 0 || area === 0) {
        dropItem.find('.item-drop-area').html(0);
        dropItem.find('.item-drop-area').css('color', 'red');
      } else {
        dropItem.find('.item-drop-area').css('color', 'black');
      }

      for (var j = 0, js = dropItem.data('data').drops.length; j < js; j++) {
      
        if (dropItem.data('data').drops[j].from.item.is(dragItem)) {
          dropItem.data('data').drops[j].area = draggedArea;
          dropItem.find('.item-drop-area').html(
            dropItem.data('data').drops.reduce(function (p, c) {
              return { area: p.area + c.area };
            }, { area: 0 }).area.toFixed(2)
          );
        }
      
      }

      updateArea(dropItem);

    }

  };

  var makeConnection = function (drag, drop) {

    var path = connections.add({
      from: { ui: drag },
      to: { ui: drop }
    });

    drag.parents('.item').data('data').drags.push({
      path: path,
      area: 0,
      to: { item: drop.parents('.item'), drop: drop }
    });

    drop.parents('.item').data('data').drops.push({
      path: path,
      area: 0,
      from: { item: drag.parents('.item'), drag: drag }
    });

    updateArea(drag.parents('.item'));

    return path;

  };

  var makeDragableItem = function (item, containerIndex, position) {

    item.draggable({
      handle: '.item-header',
      containment: 'parent',
      create: function (event, ui) {

        item.data('data').containerIndex = containerIndex; // store containerIndex (index) of parent container
        if (containerIndex !== MAX_ROTATION_LENGTH && !item.data('data').id) /* do not overwrite id of clone or existing id (from setRotation) */
          item.data('data').id = Date.now();

        // leave item at position were it was dropped
        $(this).offset({ top: position.top, left: position.left});

        if (containerIndex === 0) { 

          // add a clone to last container to mirror (clone) item
          var clone = $(this).clone();
          /* both need to know about each other */
          $(this).data('data').clone = clone;
          // add clone to last container
          $('.container.no-drop', main).append(clone);
          clone.data('data', {
            crop: { name: item.data('crop') },
            containerIndex: $('.container', main).length - 1,
            drags: [],
            drops: [],
            clone: $(this),
            area: 0,
            id: item.data('data').id
          });
          makeDragableItem(clone, $('.container', main).length - 1, $(this).position);
          addPrecrop($(this));

          // initial area
          var noCropsInFirstYear = $('.container', main).first().find('.item').length;
          var area = 1 / (noYears * noCropsInFirstYear);

          $('.container', main).first().find('.item').each(function () { $(this).data('data').area = area; });
          $('.container', main).first().find('.item-drop-area').html(area.toFixed(2));
          $('.container', main).first().find('.item').each(function () { updateArea($(this)); });

        } else {
          addPrecrop($(this));
        }
        

      },
      drag: function (event, ui) {

        // update svg paths
        connections.update($(this));
        // update clone position if item has clone
        var clone = $(this).data('data').clone;
        if (clone) {
          clone.css({ 'top': ui.position.top, 'left': ui.position.left });
          connections.update(clone);

        }

      }
    });

      
    // close button TODO: hide close button in clone
    item.find('.item-header > .ui-icon-close').on('click', function () {

      var item = $(this).parents('.item');
      var containerIndex = item.data('data').containerIndex;

      if (containerIndex === MAX_ROTATION_LENGTH)
        return;
      var clone = item.data('data').clone;
      var connectedItems = [], connectedItem = null;

      // remove connections to the left (drops)
      if (containerIndex > 0) {
        for (var i = 0, is = item.data('data').drops.length; i < is; i++) {

          connectedItem = item.data('data').drops[i].from.item;

          for (var j = 0, js = connectedItem.data('data').drags.length; j < js; j++) {
            
            if (connectedItem.data('data').drags[j].to.item.is(item)) {

              var connection = connections.remove(item.data('data').drops[i].path);
              if (connection) {
                connectedItem.data('data').drags.splice(j, 1);
                // recalculate splitted areas
                // if more than one connection ...
                if (connectedItem.data('data').drags.length > 0) {

                  connectedItem.find('.item-body-right')[j].remove();
                  var height = connectedItem.find('.item-body').height();
                  var siblings = connectedItem.find('.item-body-right');
                  siblings.css('height', height / siblings.length);
                
                } /*else {
                  connectedItem.find('.item-body-right').removeClass('ui-icon ui-icon-close');
                }*/
                
              }
              
              connectedItems.push(connectedItem);
              break;

            }

          }

        }
        connections.update(); // update all
      }

      // remove connections to the right (drags)
      for (var i = 0, is = item.data('data').drags.length; i < is; i++) {

        connectedItem = item.data('data').drags[i].to.item;

        for (var j = 0, js = connectedItem.data('data').drops.length; j < js; j++) {
          
          if (connectedItem.data('data').drops[j].from.item.is(item)) {

            var connection = connections.remove(item.data('data').drags[i].path);
            if (connection) {
              connectedItem.data('data').drops.splice(j, 1);
            }

            connectedItems.push(connectedItem);
            break;
          }

        }


      }

      if (clone) {

        // remove connections to the left (drops)
        for (var i = 0, is = clone.data('data').drops.length; i < is; i++) {

          connectedItem = clone.data('data').drops[i].from.item;

          for (var j = 0, js = connectedItem.data('data').drags.length; j < js; j++) {
            
            if (connectedItem.data('data').drags[j].to.item.is(clone)) {

              var connection = connections.remove(clone.data('data').drops[i].path);
              if (connection) {
                connectedItem.data('data').drags.splice(j, 1);

                // recalculate splitted areas
                // if more than one connection ...
                if (connectedItem.data('data').drags.length > 0) {

                  connectedItem.find('.item-body-right')[j].remove();
                  var height = connectedItem.find('.item-body').height();
                  var siblings = connectedItem.find('.item-body-right');
                  siblings.css('height', height / siblings.length);
                
                } /*else {
                  connectedItem.find('.item-body-right').removeClass('ui-icon ui-icon-close');
                }*/

              }

              connectedItems.push(connectedItem);
              break;
            
            }

          }


        }

        item.data('data').clone.remove();
      }

      item.remove();

      for (var i = 0, is = connectedItems.length; i < is; i++)
        updateArea(connectedItems[i]);

      updateRotationLength();

    });

    item.children('.item-body').on('click', function () {

      $('.active', main).removeClass('active');
      $(this).addClass('active');

      // load item data
      $('#crop-name', edit).html($(this).parent('.item').data('data').crop.name);

    });


  }; // make item

  var makeDragableConnector = function (drag, drop) {

    drag.draggable({
      helper: 'clone',
      zIndex: 1000,
      appendTo: rotationUi,
      create: function () {

        
        $(this).on('click', function () {

          // remove a connection
          var dragItem = $(this).parents('.item');
          var dragData = dragItem.data('data');

          if (dragData.drags.length > 0) {

            var index = dragItem.find('.item-drag').index($(this));
            var connection = connections.remove(dragData.drags[index].path);
            if (connection) {
              var old = dragData.drags.splice(index, 1);
              var dropData = old[0].to.item.data('data');
              for (var i = 0, is = dropData.drops.length; i < is; i++) {
                if (dropData.drops[i].from.item.is(dragItem)) {
                  dropData.drops.splice(i, 1);
                  break;
                }
              } 

              updateArea(old[0].to.item);             

              // if more than one connection ...
              if (dragData.drags.length > 0) {

                var height = $(this).parents('.item-body').height();
                var siblings = $(this).parent().siblings('.item-body-right');
                siblings.css('height', height / siblings.length);
                $(this).parents('.item-body-right').remove();
                connections.update($(siblings[0]).parents('.item'));
              
              } /*else {
                $(this).children('span').removeClass('ui-icon ui-icon-close');
              }*/

              updateArea(dragItem);

            }
          }

        }); // on click

        if (drop) {

          var path = makeConnection(drag, drop);
          // $(this).children('span').addClass('ui-icon ui-icon-close');   
          connections.update($(this).parents('.item'));      

        }
      
      }, // create
      start: function (event, ui) {

        var item = $(this).parents('.item');

        // check if max. no. of precrops has been reached
        if (item.data('data').drags.length === MAX_DRAGS_PER_CROP) {
          if (DEBUG) console.log('max. no. of drags has been reached');
          return false;
        }

        // avoid n:m connections
        if (item.data('data').drops.length > 1 && item.data('data').drags.length > 0) {
          if (DEBUG) console.log('avoid n:m connections');
          return false;        
        }

      }, // start
      drag: function (event, ui) {

        previewConnection.style.opacity = 1;

        var offsetFrom = $(this).offset();
        var offsetTo = ui.offset;
        var ptFrom  = svg.createSVGPoint();
        var ptTo  = svg.createSVGPoint();

        ptFrom.x = offsetFrom.left + $(this).width() * 0.5;
        ptFrom.y = offsetFrom.top + $(this).height() * 0.5;
        ptFrom = ptFrom.matrixTransform(svg.getScreenCTM().inverse());

        ptTo.x = offsetTo.left + ui.helper.width() * 0.5;
        ptTo.y = offsetTo.top + ui.helper.height() * 0.5;
        ptTo = ptTo.matrixTransform(svg.getScreenCTM().inverse());

        previewConnection.pathSegList[0].x = ptFrom.x;
        previewConnection.pathSegList[0].y = ptFrom.y;
        previewConnection.pathSegList[1].x = ptTo.x;
        previewConnection.pathSegList[1].y = ptTo.y;
        previewConnection.pathSegList[1].x1 = previewConnection.pathSegList[1].x2 = ptFrom.x + (ptTo.x - ptFrom.x) * 0.5;      
        previewConnection.pathSegList[1].y1 = ptFrom.y;
        previewConnection.pathSegList[1].y2 = ptTo.y;

      }, // drag
      stop: function (event, ui) {

        previewConnection.style.stroke = '#aaa';
        previewConnection.style.opacity = 0;

      } // stop
    }); // draggable

  }; // makeDragableConnector


  var addPrecrop = function (item) {

    item.append(
      "<div class='item-body'>\
        <div class='item-body-left'>\
          <div class='item-drop'><span class='item-drop-area'>0</span></div>\
        </div>\
        <div class='item-body-right'>\
          <span class='item-drag-area'>1</span>\
          <div class='item-drag'><span></span></div>\
        </div>\
      </div>");

    makeDragableConnector($(item.find('.item-drag').last()));
    
    // create droppable in new crop area
    $('.item-drop', item).droppable({
      accept: '.item-drag', 
      tolerance: 'touch',
      create: function () {

      }, // create
      over: function (event, ui) {

        if (connectionAllowed(ui.draggable, $(this))) {

          $(this).css('background-color', 'green');
          ui.draggable.css('background-color', 'green');
          previewConnection.style.stroke = 'green';

        } else {
          
          $(this).css('background-color', 'red');
          ui.draggable.css('background-color', 'red');
          previewConnection.style.stroke = 'red';

        }

      }, // over
      out: function (event, ui) {

        $(this).css('background-color', 'rgb(153, 153, 153)');
        ui.draggable.css('background-color', 'rgb(153, 153, 153)');
        previewConnection.style.stroke = '#aaa';

      }, // out
      drop: function (event, ui) {

        var drag = ui.draggable;
        var drop = $(this);

        drag.css('background-color', 'rgb(153, 153, 153)');
        drop.css('background-color', 'rgb(153, 153, 153)');
        previewConnection.style.stroke = '#aaa';
        previewConnection.style.opacity = 0;
        
        if (!connectionAllowed(drag, drop))
          return false;

        // drag.children('span').addClass('ui-icon ui-icon-close');

        if (drag.parents('.item').data('data').drags.length > 0) {

          var pre = drag.parents('.item-body');
          var noDrags = drag.parents('.item').data('data').drags.length;

          if (pre.find('.item-body-right').length < MAX_DRAGS_PER_CROP) {
            
            pre.append(
              "<div class='item-body-right'>\
                <span class='item-drag-area'>0</span>\
                <div class='item-drag'><span></span></div>\
              </div>"
            );

            pre.find('.item-drag-area').html((1 / (noDrags + 1)).toFixed(2));

            // TODO: layout
            drag.parents('.item-body').find('.item-body-right').css('height', pre.height() / (noDrags + 1));
            drag.parent().css('height', (pre.height() - $('.item-body-right').css('border-top-width') * 2 * (noDrags + 1)) / (noDrags + 1));
            makeDragableConnector($(pre.find('.item-drag').last()), drop);

            // update clone if there is any
            var clone = drop.parents('.item').data('data').clone;
            if (clone) {
              if (clone.data('data').containerIndex === 0) {

                clone.data('data').drops = drop.parents('.item').data('data').drops;              

              }
            }

          }

        } else {


          var path = makeConnection(drag, drop);


          // update clone if there is any
          var clone = drop.parents('.item').data('clone');
          if (clone) {
            if (clone.data('data').containerIndex === 0) {

              clone.data('data').drops = drop.parents('.item').data('data').drops;

            }
          }

        }

      } // drop
    }); // droppable
  }; // addPrecrop

  // item well
  $('.well-item', well).draggable({
    helper: 'clone'
  });

  // container 
  $('.container:not(.no-drop)', main).droppable({
    tolerance: 'fit',
    accept: '.well-item',
    create: function (event, ui) {
      // $(this).data('crops', []);
    },
    over: function (event, ui) {

    },
    out: function (event, ui) {

    },
    drop: function (event, ui) {

      if (!itemDropAllowed($(this)))
        return false;

      var containerIndex = $('.container', main).index($(this));
      

      var item = $(ui.draggable).clone();
      item.switchClass('well-item', 'item');
      var data = {
        crop: { name: item.data('crop') },
        containerIndex: containerIndex,
        drags: [],
        drops: [],
        clone: null,
        area: 0
      };

      item.data('data', data);
      item.appendTo(this);
      makeDragableItem(item, containerIndex, ui.offset);
      item.css('left', ((widthMain / (MAX_ROTATION_LENGTH + 1)) - parseInt(item.css('width'))) * 0.5);
      if (parseInt(item.css('top')) + parseInt(item.css('height')) > heightMain)
        item.css('top', heightMain - parseInt(item.css('height')));

      // update length of rotation
      updateRotationLength();
    }
  });

  var rotation = function () {

    var rotation = connections.get();
    if (DEBUG) console.log(JSON.stringify(rotation, null, 2));
    return rotation;

  };

  var removeRotation = function () {

    connections.remove();
    $('.item', main).remove();

  };

  var setRotation = function (rotation) {

    removeRotation();

    function addCrop(containerIndex, crop, id) {

      var item = $(
        "<div class='item' data-crop='"+crop.name+"'>\
          <div class='item-header'>\
            <span class='item-label'>"+crop.name+"</span>\
            <span class='ui-icon ui-icon-close'></span>\
          </div>\
        </div>"
      ).appendTo('.container:eq('+containerIndex+')', main);

      var color = $('div[data-crop="'+crop.name+'"]', '#well').children('.item-header').css('background-color');
      $('.item-header', item).css('background-color', color);

      var data = {
        crop: { name: item.data('crop') },
        containerIndex: containerIndex,
        drags: [],
        drops: [],
        clone: null,
        area: 0,
        id: id
      };

      item.data('data', data);
      var left = ((widthMain / (MAX_ROTATION_LENGTH + 1)) - parseInt(item.css('width'))) * 0.5;
      var top = 5 + (parseInt(item.css('height')) + 5) * ($('.container:eq('+containerIndex+')', main).children('.item').length - 1);
      item.css('left', left);
      item.css('top', top);
      makeDragableItem(item, containerIndex, 0);
      updateRotationLength();
      
      return item;

    }

    function addConnection(from, to) {

      var drop = to.find('.item-drop.ui-droppable');
      var drag = from.find('.item-drag.ui-draggable.ui-draggable-handle');

      if (!connectionAllowed(drag, drop))
        return;
      
      if (from.data('data').drags.length > 0) {

        var pre = drag.parents('.item-body');
        var noDrags = drag.parents('.item').data('data').drags.length;

        if (pre.find('.item-body-right').length < MAX_DRAGS_PER_CROP) {
          
          pre.append(
            "<div class='item-body-right'>\
              <span class='item-drag-area'>0</span>\
              <div class='item-drag'><span></span></div>\
            </div>"
          );

          pre.find('.item-drag-area').html((1 / (noDrags + 1)).toFixed(2));

          drag.parents('.item-body').find('.item-body-right').css('height', pre.height() / (noDrags + 1));
          drag.parent().css('height', (pre.height() - $('.item-body-right', from).css('border-top-width') * 2 * (noDrags + 1)) / (noDrags + 1));
          makeDragableConnector($(pre.find('.item-drag').last()), drop);

          // update clone if there is any
          var clone = drop.parents('.item').data('data').clone;
          if (clone) {
            if (clone.data('data').containerIndex === 0)
              clone.data('data').drops = drop.parents('.item').data('data').drops;
          }

        }

      } else {
        makeConnection(drag, drop);
      }

    }

    var crops, connect = [], years = rotation.length;

    for (var y = 0; y < years; y++) {

      crops = rotation[y];

      for (var c = 0, cs = crops.length; c < cs; c++) {

        var item = addCrop(y, crops[c].crop, crops[c].id);
        connect.push({
          item: item,
          crop: crops[c],
          year: y
        });

      }

    }

    for (var i = 0, is = connect.length; i < is; i++) {

      for (var j = 0, js = connect[i].crop.to.length; j < js; j++) {

        if (connect[i].year === years - 1) { // last year: connect to clone
          var to = connect.filter(function (ele, index) {
            return (connect[i].crop.to[j] === ele.crop.id);
          });
          if (to.length > 0)
            addConnection(connect[i].item, to[0].item.data('data').clone);
        } else {
          var to = connect.filter(function (ele, index) {
            return (index > i && connect[i].crop.to[j] === ele.crop.id);
          });
          if (to.length > 0)
            addConnection(connect[i].item, to[0].item);
        }

      }

    }

  };

  return {
    rotation: rotation,
    setRotation: setRotation
  };

};
