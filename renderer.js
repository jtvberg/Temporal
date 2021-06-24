// TODO: Copy/Paste objects

// Imports and variable declarations
const { ipcRenderer, clipboard } = require('electron')
const $ = require('jquery')
let change = false
let settings = []

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
    $('body').css('background-color', '')
    $('.header-bar').removeClass('header-bar-max')
  } else {
    $('body').css('background-color', '#00000000')
    $('.header-bar').addClass('header-bar-max')
  }
}

// Create canvases for sketch mode
function sketchCanvas (canvasElement, strokeColor, id) {
  const canvas = canvasElement[0]
  const ctx = canvas.getContext('2d')
  // let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const image = new Image()
  image.onload = function () {
    ctx.drawImage(image, 0, 0)
  }
  image.src = localStorage.getItem('sketches') ? JSON.parse(localStorage.getItem('sketches'))[id] : 'data:image/png:base64,'
  const stroke = strokeColor
  const mouse = { x: 0, y: 0 }

  function canvasSize () {
    // canvas.width = $('.note-host').width()
    // canvas.height = $('.note-host').height()
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

  canvasSize()
  ctxSetup()

  // $(window).on('resize', () => {
  //   canvasSize()
  //   ctx.putImageData(imageData, 0, 0)
  //   if (image) {
  //     ctx.drawImage(image, 0, 0)
  //   }
  //   ctxSetup()
  // })

  $(canvasElement).on('contextmenu', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    image.src = 'data:image/png:base64,'
  })

  canvas.addEventListener('mousemove', function (e) {
    mouse.x = e.pageX - this.offsetLeft
    mouse.y = e.pageY - this.offsetTop
  }, false)

  canvas.addEventListener('mousedown', () => {
    ctx.beginPath()
    ctx.moveTo(mouse.x, mouse.y)
    canvas.addEventListener('mousemove', onPaint, false)
  }, false)

  canvas.addEventListener('mouseup', () => {
    // imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    canvas.removeEventListener('mousemove', onPaint, false)
  }, false)
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
    if (!$(e.target).hasClass('note-entry-host')) { return }
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
    // elmnt.style.top = elmnt.offsetTop - pos2 > 0 ? Math.round((elmnt.offsetTop - pos2) / 20) * 20 + 'px' : 0 + 'px'
    // elmnt.style.left = elmnt.offsetLeft - pos1 > 0 ? Math.round((elmnt.offsetLeft - pos1) / 20) * 20 + 'px' : 0 + 'px'
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
    if (!$(this).find('.note-entry').text().trim().length > 0 && !$(this).hasClass('remove')) {
      $(this).addClass('remove').remove()
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

// Save note content to local storage
$(document).on('blur', '.note-entry-host', () => {
  if (change) {
    // Remove empty note-entries and save all notes
    removeEmptyNoteEntries()
    saveNotes()
  }
})

// Focus on note entry host on click
$(document).on('click, mousedown', '.note-entry-host', function () {
  try {
    $(this).trigger('focus')
    removeEmptyNoteEntries()
  } catch (err) {
    // Ignore, this is a known jquery issue
  }
})

// Reset note etry size on right-click
$(document).on('contextmenu', '.note-entry-host', function () {
  $(this).css({ 'font-size': '' })
})

// Focus on note entry on click
$(document).on('click', '.note-entry', function (e) {
  e.stopPropagation()
  $(this).trigger('focus')
})

// Delete note-entry handler
$(document).on('keydown', '.note-entry-host', (e) => {
  if ($(e.target).hasClass('note-entry-host') && (e.key === 'Delete' || e.key === 'Backspace')) {
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
})

// Zoom text size on mouse wheel
$(document).on('wheel', '.note-entry', function (e) {
  if (e.ctrlKey) {
    const delta = e.originalEvent.deltaY
    let currentSize = $(e.target).closest('.note-entry-host').css('font-size').replace('px', '')
    if (delta < 0) {
      currentSize++
    } else if (currentSize > 8) {
      currentSize--
    }
    $(e.target).closest('.note-entry-host').css({ 'font-size': `${currentSize}px` })
  }
})

// Override paste to plain-text
$(document).on('paste', '.note-entry', () => {
  clipboard.writeText(clipboard.readText())
})

// Reset font size on double-click
$(document).on('dblclick', '.note-entry-host', function () {
  $(this).find('.note-entry').children().each(function () {
    $(this).removeAttr('style')
  })
  $(this).find('.note-entry').css({ 'font-size': '18px' })
})

// Stop double-click of entry from propagating
$(document).on('dblclick', '.note-entry', (e) => {
  e.stopPropagation()
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
    saveNotes()
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
})

// Toggle between transparency and vibrancy
$('.trans-button').on('click', () => {
  if ($('.trans-button').hasClass('trans-on')) {
    ipcRenderer.send('trans-set', true)
    $('.trans-button').removeClass('trans-on').addClass('trans-off')
  } else {
    ipcRenderer.send('trans-set', false)
    $('.trans-button').removeClass('trans-off').addClass('trans-on')
  }
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
    $('.note').each(function () {
      $(this).css('z-index', '20')
    })
  } else {
    $(this).addClass('sketch-mode')
    $('.note').each(function () {
      $(this).css('z-index', '5')
    })
  }
})

// Header double-click handler
$('.header-bar').on('dblclick', () => {
  maxRestoreWindow()
})

// Header button double-click/right-click handler (stop prop)
$('.ontop-button, .trans-button, .note-button, .sketch-button').on('dblclick, contextmenu', (e) => {
  e.stopPropagation()
})

// Header right-click handler
$('.header-bar').on('contextmenu', () => {
  ipcRenderer.send('win-hide')
})

// Iterate and instantiate sketch canvases
$('.sketch').each(function () {
  sketchCanvas($(this), $(this).css('color'), $(this).data('val'))
})

// Add note entry at point of click
$('.note').on('click', function (e) {
  if ($(e.target).hasClass('note')) {
    const id = 'ne' + Date.now()
    const noteEntryHost = $(`<div id=${id} tabindex="0"></div>`)
    noteEntryHost.addClass('note-entry-host').css('left', e.pageX - this.offsetLeft).css('top', e.pageY - this.offsetTop).appendTo(this)
    $('<div contenteditable="true"></div>').addClass('note-entry').appendTo(noteEntryHost).trigger('focus')
    dragElement($(`#${id}`)[0])
  }
})

// Add drag behavior to note-entries
$('.note-entry-host').each(function () {
  dragElement($(`#${this.id}`)[0])
})
