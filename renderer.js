// TODO: Copy/Paste objects

// Imports and variable declarations
const { ipcRenderer, clipboard } = require('electron')
const $ = require('jquery')
let change = false
let curTrans = false
let noFocus = false
let scrollTimeout = null
let settings = []
let mode = ''

// Load methods
setFirstNote()
changeWatch($('.note-host'))
loadSettings()

// Settings save invoke from main
ipcRenderer.on('save-settings', (e, data) => {
  settings = {
    windowSizeLocation : data.windowSizeLocation,
    onTop : $('.ontop-button').hasClass('ontop-locked')
  }
  localStorage.setItem('settings', JSON.stringify(settings))
})

// Load settings
function loadSettings () {
  $('.sketch-tool-panel').hide()

  settings = localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : getDefaultSettings()

  // Set window size and location
  ipcRenderer.send('set-window', settings.windowSizeLocation)

  // Set window on top
  if (settings.onTop) {
    ipcRenderer.send('ontop-lock')
  } else {
    $('.ontop-button').removeClass('ontop-locked').addClass('ontop-unlocked')
  }
}

// Return default settings
function getDefaultSettings () {
  const defaultSettings = {
    onTop: true,
    windowSizeLocation: { x: 0, y: 0, height: 400, width: 300 }
  }
  return defaultSettings
}

// Select first note
function setFirstNote () {
  $('#note-button-0').addClass('note-button-selected')
  $('#note-0').show()
  $('#sketch-0').show()
}

// Mutation observer to track note changes
function changeWatch (note) {
  var observer = new window.MutationObserver(function () {
    change = true
  })
  observer.observe(note[0], {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  })
}

// Window max/restore on header double click
function maxRestoreWindow () {
  ipcRenderer.send('win-max')
  if ($('.header-bar').hasClass('header-bar-max')) {
    setTransWindow(curTrans)
    $('body').css('background-color', '')
    $('.header-bar').removeClass('header-bar-max')
  } else {
    setTransWindow(true)
    $('body').css('background-color', '#00000000')
    $('.header-bar').addClass('header-bar-max')
  }
}

// Window transparency toggle
function setTransWindow (trans) {
  if (trans) {
    ipcRenderer.send('trans-set', false)
    $('.trans-button').removeClass('trans-off').addClass('trans-on')
  } else {
    ipcRenderer.send('trans-set', true)
    $('.trans-button').removeClass('trans-on').addClass('trans-off')
  }
}

// Create canvases for sketch mode
function sketchCanvas (canvasElement, strokeColor, id) {
  const canvas = canvasElement[0]
  const ctx = canvas.getContext('2d')
  const image = new Image()
  image.onload = function () {
    ctx.drawImage(image, 0, 0)
  }
  image.src = localStorage.getItem('sketches') ? JSON.parse(localStorage.getItem('sketches'))[id] : 'data:image/png:base64,'
  let stroke = strokeColor
  const mouse = { x: 0, y: 0 }

  function canvasSize () {
    canvas.width = '5120'
    canvas.height = '2880'
  }

  function ctxSetup () {
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = stroke
  }

  function onPaint () {
    ctx.lineTo(mouse.x, mouse.y)
    ctx.stroke()
  }

  function clearSketch () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    image.src = 'data:image/png:base64,'
  }

  canvasSize()
  ctxSetup()

  $(canvasElement).on('contextmenu', () => {
    clearSketch()
  })

  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.offsetX
    mouse.y = e.offsetY
  }, false)

  canvas.addEventListener('mousedown', () => {
    ctx.beginPath()
    ctx.moveTo(mouse.x, mouse.y)
    canvas.addEventListener('mousemove', onPaint, false)
  }, false)

  canvas.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', onPaint, false)
  }, false)

  // Track color picker input
  $('.sketch-color-input').on('input', function () {
    stroke = $(this).val()
    ctxSetup()
    $(this).parent().find('.sketch-color-button').css('color', stroke)
    if ($(':focus').hasClass('sketch-shape')) {
      $(':focus').css('border-color', stroke)
    }
  })
}

// Note entry drag functions
function dragElement (elmnt) {
  var pos1 = 0
  var pos2 = 0
  var pos3 = 0
  var pos4 = 0
  if (document.getElementById(elmnt.id)) {
    document.getElementById(elmnt.id).onmousedown = dragMouseDown
  } else {
    elmnt.onmousedown = dragMouseDown
  }

  function dragMouseDown (e) {
    if (!$(e.target).hasClass('note-entry-host') && !$(e.target).hasClass('sketch-shape')) { return }
    e = e || window.event
    e.preventDefault()
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    document.onmousemove = elementDrag
  }

  const pre = 1

  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    elmnt.style.top = round(elmnt.offsetTop - pos2, pre) > 0 ? round(elmnt.offsetTop - pos2, pre) + 'px' : 0 + 'px'
    elmnt.style.left = round(elmnt.offsetLeft - pos1, pre) > 0 ? round(elmnt.offsetLeft - pos1, pre) + 'px' : 0 + 'px'
  }

  function closeDragElement () {
    document.onmouseup = null
    document.onmousemove = null
    change = true
    $('.note-entry').trigger('blur')
  }

  function round (num, precision) {
    num = parseFloat(num)
    if (!precision) return num
    return (Math.round(num / precision) * precision)
  }
}

// Remove empty note-entries
function removeEmptyNoteEntries () {
  $('.note-entry-host').each(function () {
    if (!$(this).find('.note-entry').text().trim().length > 0) {
      $(this).remove()
    }
  })
}

// Save all notes
function saveNotes () {
  const notes = []
  $('.note').each(function () {
    notes.push($(this)[0].innerHTML)
  })
  localStorage.setItem('notes', JSON.stringify(notes))
  change = false
}

// Save all sketches
function saveSketches () {
  const sketches = []
  $('.sketch').each(function () {
    const canvas = $(this)[0]
    const ctx = canvas.getContext('2d')
    ctx.save()
    sketches.push(canvas.toDataURL())
  })
  localStorage.setItem('sketches', JSON.stringify(sketches))
}

// Toggle sketch pad vs note pad
function toggleSketch (show) {
  let index = show ? 5 : 20
  $('.note').each(function () {
    $(this).css('z-index', index)
  })
}

// Mark direction of notes outside of view on scroll
function showScrollCarets (el) {
  $('.scroll-arrow').hide()
  if ($(el).find('.note:visible').offset().left < 0) {
    $('.scroll-arrow-left').show()
  }
  if ($(el).find('.note:visible').offset().top < 24) {
    $('.scroll-arrow-up').show()
  }
  $(el).find('.note:visible').children('.note-entry-host, .sketch-shape').each(function () {
    if ($(this).offset().left > $(window).width()) {
      $('.scroll-arrow-right').show()
    }
    if ($(this).offset().top > $(window).height()) {
      $('.scroll-arrow-down').show()
    }
  })
}

// Return a circle
function addCircle (id, x, y, r, color) {
  return $(`<div id="${id}" class="sketch-shape" tabindex="0" style="left: ${x}px; top: ${y}px; height: ${r}px; width: ${r}px; border-radius: 50%; border-color: ${color};"></div>`)
}

// Return a rectangle
function addRect (id, x, y, w, h, color) {
  return $(`<div id="${id}" class="sketch-shape" tabindex="0" style="left: ${x}px; top: ${y}px; height: ${h}px; width: ${w}px; border-color: ${color};"></div>`)
}

// Add resize glyph to element
function addResize (element) {
  let resizer = document.createElement('div')
  resizer.className = 'resizer'

  $(element).empty()
  element.appendChild(resizer)
  resizer.addEventListener('mousedown', initResize, false)

  function initResize() {
    window.addEventListener('mousemove', resize, false)
    window.addEventListener('mouseup', stopResize, false)
  }
  function resize(e) {
    element.style.width = (e.clientX - element.offsetLeft) + 'px'
    element.style.height = (e.clientY - element.offsetTop) + 'px'
  }
  function stopResize() {
    window.removeEventListener('mousemove', resize, false)
    window.removeEventListener('mouseup', stopResize, false)
    saveNotes()
  }
}

// Add or remove a check box to an element
function toggleCheckListItem(ele) {
  if ($(ele).closest('.note-entry-host').length > 0) {
    if ($(ele).find('.note-entry-check').length > 0) {
      $(ele).find('.note-entry-check').remove()
    } else {
      const checkBox = '<span class="far note-entry-check note-entry-unchecked">&nbsp;</span>'
      $(ele).prepend(checkBox).children('div').prepend(checkBox)
    }
  }
}

// Save note content to local storage
$(document).on('blur', '.note-entry-host, .sketch-shape', () => {
  if (change) {
    saveNotes()
  }
})

// Focus on note entry host on click
$(document).on('mousedown', (e) => {
  try {
    if ($(e.target).hasClass('note-entry-host') || $(e.target).hasClass('sketch-shape')) {
      $(e.target).trigger('focus')
    }
    else if ($(e.target).hasClass('sketch-color-button')) {
      e.preventDefault()
    }
    removeEmptyNoteEntries()
  } catch (err) {
    // Ignore, this is a known jquery issue
  }
})

// Reset note etry size on double-click
$(document).on('dblclick', '.note-entry-host', function () {
  $(this).css({ 'font-size': '' })
})

// Delete note-entry handler
$(document).on('keydown', '.note-entry-host, .sketch-shape', (e) => {
  if (($(e.target).hasClass('note-entry-host') || $(e.target).hasClass('sketch-shape')) && (e.key === 'Delete' || e.key === 'Backspace')) {
    $(e.target).remove()
    saveNotes()
  }
})

// Handle keyboard short-cuts
$(document).on('keydown', 'body', (e) => {
  if (e.metaKey) {
    if (e.key.toLowerCase() === 'm') {
      e.preventDefault()
      ipcRenderer.send('win-hide')
    }
    if (e.key.toLowerCase() === 's') {
      e.preventDefault()
      $('.sketch-button').trigger('click')
    }
    if (e.key.toLowerCase() === 'l') {
      e.preventDefault()
      $('.ontop-button').trigger('click')
    }
  }
  if (e.key === 'Escape') {
    removeEmptyNoteEntries()
  }
})

// Zoom text size on mouse wheel
$(document).on('wheel', '.note-entry', (e) => {
  if (e.ctrlKey) {
    $('.note-host').css('overflow', 'hidden')
    const delta = e.originalEvent.deltaY
    let currentSize = $(e.target).closest('.note-entry-host').css('font-size').replace('px', '')
    if (delta < 0) {
      currentSize++
    } else if (currentSize > 8) {
      currentSize--
    }
    $(e.target).closest('.note-entry-host').css({ 'font-size': `${currentSize}px` })
  } else {
    $('.note-host').css('overflow', '')
  }
})

// Override paste to plain-text
$(document).on('paste', '.note-entry', () => {
  clipboard.writeText(clipboard.readText())
})

// Stop double-click of entry from propagating
$(document).on('dblclick', '.note-entry', (e) => {
  e.stopPropagation()
})

// Toggle check boxes
$(document).on('click', '.note-entry-check', function () {
  if ($(this).hasClass('note-entry-unchecked')) {
    $(this).removeClass('note-entry-unchecked')
    $(this).addClass('note-entry-checked')
  } else {
    $(this).removeClass('note-entry-checked')
    $(this).addClass('note-entry-unchecked')
  }
})

// Get note content from local storage
$('.note').each(function () {
  $(this)[0].innerHTML = localStorage.getItem('notes') ? JSON.parse(localStorage.getItem('notes'))[$(this).data('val')] : ''
})

// Save sketches to local storage on mouse up
$('.sketch').on('mouseup', () => {
  saveSketches()
})

// Right-click on note button to clear it
$('.note-button').on('contextmenu', (e) => {
  const confirmDelete = confirm('Delete all notes on this page?')
  if (confirmDelete) {
    $(`#note-${$(e.currentTarget).data('val')}`).empty()
    $('.note-host').scrollTop(0).scrollLeft(0)
    $('.scroll-arrow').hide()
    $(`#sketch-${$(e.currentTarget).data('val')}`).trigger('contextmenu')
    saveNotes()
    saveSketches()
  }
})

// Toggle to selected note/sketch pair; clear notes on metaKey
$('.note-button').on('click', (e) => {
  if (e.metaKey) {
    // set color
    // white?
    return
  }
  $('.note-button').removeClass('note-button-selected')
  $('.note, .sketch').hide(0)
  $(`#note-${$(e.currentTarget).data('val')}, #sketch-${$(e.currentTarget).data('val')}`).show()
  $(`#note-button-${$(e.currentTarget).data('val')}`).addClass('note-button-selected')
  $('.note-host').scrollTop(0).scrollLeft(0)
})

// Toggle between transparency and vibrancy
$('.trans-button').on('click', () => {
  curTrans = $('.trans-button').hasClass('trans-off')
  setTransWindow(curTrans)
})

// Toggle keep on top
$('.ontop-button').on('click', function () {
  if ($(this).hasClass('ontop-locked')) {
    $(this).removeClass('ontop-locked').addClass('ontop-unlocked')
    ipcRenderer.send('ontop-unlock')
  } else {
    $(this).removeClass('ontop-unlocked').addClass('ontop-locked')
    ipcRenderer.send('ontop-lock')
  }
})

// Toggle between note and sketch canvas
$('.sketch-button').on('click', function () {
  if ($(this).hasClass('sketch-mode')) {
    $(this).removeClass('sketch-mode')
    $('.sketch-tool-panel').hide()
    toggleSketch(false)
  } else {
    $(this).addClass('sketch-mode')
    $('.sketch-tool-panel').show()
    $('#sketch-pencil').trigger('click')
    toggleSketch(true)
  }
  mode = ''
})

// Sketch tools selection
$('.sketch-tool').on('click', function () {
  $('.sketch-tool').removeClass('sketch-mode')
  $(this).addClass('sketch-mode')
})

// Header double-click handler
$('.header-bar').on('dblclick', () => {
  maxRestoreWindow()
})

// Header button double-click/right-click handler (stop prop)
$('.control-button-host, .note-button-host').on('dblclick contextmenu', (e) => {
  e.stopPropagation()
})

// Header right-click handler
$('.header-bar').on('contextmenu', () => {
  ipcRenderer.send('win-hide')
})

// Iterate and instantiate sketch canvases
$('.sketch').each(function () {
  sketchCanvas($(this), '#e0e0e0', $(this).data('val'))
})

// Track if a note element is focused
$('.note').on('mousedown', (e) => {
  if ($(e.target).hasClass('note') || $(e.target).hasClass('note-entry-host')) {
    getSelection().removeAllRanges()
  }
  if ($(':focus').hasClass('note-entry') || $(':focus').hasClass('note-entry-host') || $(':focus').hasClass('sketch-shape')) {
    noFocus = false
  } else {
    noFocus = true
  }
})

// Add note entry at point of click
$('.note').on('click', function (e) {
  if ($(':focus').hasClass('note-entry') || $(':focus').hasClass('note-entry-host') || $(':focus').hasClass('sketch-shape')) {
    noFocus = false
  }
  if ($(this).hasClass('note') && noFocus) {
    const id = 'ne' + Date.now()
    switch (mode) {
      case 'circle': {
        const ele = addCircle(id, e.offsetX, e.offsetY, 50, $('.sketch-color-input').val())
        ele.appendTo(this)
        $(ele).trigger('focus')
        addResize(ele[0])
        break
      }
      case 'rect': {
        const ele = addRect(id, e.offsetX, e.offsetY, 50, 50, $('.sketch-color-input').val())
        ele.appendTo(this)
        $(ele).trigger('focus')
        addResize(ele[0])
        break
      }
      default: {
        const noteEntryHost = $(`<div id=${id} tabindex="0"></div>`)
        noteEntryHost.addClass('note-entry-host').css('left', e.offsetX).css('top', e.offsetY).appendTo(this)
        $('<div contenteditable="true"></div>').addClass('note-entry').appendTo(noteEntryHost).trigger('focus')
      }
    }
    dragElement($(`#${id}`)[0])
  }
})

// Add drag behavior to note-entries
$('.note-entry-host').each(function () {
  dragElement($(`#${this.id}`)[0])
})

// Add drag/resize behavior to sketch-shapes
$('.sketch-shape').each(function () {
  dragElement($(`#${this.id}`)[0])
  addResize(this)
})

// Call scroll carets on scroll
$('.note-host').on('scroll', function () {
  showScrollCarets(this)
  if (scrollTimeout) { clearTimeout(scrollTimeout) }
  scrollTimeout = setTimeout(function () {
    $('.scroll-arrow').hide(300)
  }, 800)
})

// Activate color picker
$('.sketch-color-button').on('click', function () {
  $(this).parent().find('.sketch-color-input').trigger('click')
})

// Activate circle mode
$('#sketch-circle').on('click', () => {
  toggleSketch(false)
  mode = 'circle'
})

// Activate rectangle mode
$('#sketch-rect').on('click', () => {
  toggleSketch(false)
  mode = 'rect'
})

// Actiave pencil mode (default sketch mode)
$('#sketch-pencil').on('click', () => {
  toggleSketch(true)
})

// Save when change is complete
$('.sketch-color-input').on('change', function () {
  saveNotes()
})

// Add check boxes to note entry
$('.check-button').on('mousedown', (e) => {
  e.preventDefault()
  let eles = getSelection().rangeCount > 0 ? $(getSelection().getRangeAt(0)) : []
  if (eles[0]) getCheckListElement(eles[0].startContainer.parentNode)
  // Get element to add check box too
  function getCheckListElement(node) {
    toggleCheckListItem(node)
    if (node.nextSibling && node.nextSibling !== eles[0].endContainer.parentNode.nextSibling) {
      getCheckListElement(node.nextSibling)
    }
  }
})
