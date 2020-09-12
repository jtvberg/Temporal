// Imports and variable declarations
const { ipcRenderer, clipboard } = require('electron')
const $ = require('jquery')
let change = false
let winMax = false

// Load methods
setFirstNote()
changeWatch($('.note-host'))

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
  if (!winMax) {
    ipcRenderer.send('win-max')
    $('body').css('background-color', '#00000000')
    winMax = true
  } else {
    ipcRenderer.send('win-restore')
    winMax = false
    $('body').css('background-color', '#161616b4')
  }
}

// Create canvases for sketch mode
function sketchCanvas (canvasElement, strokeColor) {
  const canvas = canvasElement[0]
  const ctx = canvas.getContext('2d')
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const stroke = strokeColor
  const mouse = { x: 0, y: 0 }

  function canvasSize () {
    canvas.width = $('.note-host').width()
    canvas.height = $('.note-host').height()
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

  $(window).resize(() => {
    canvasSize()
    ctx.putImageData(imageData, 0, 0)
    ctxSetup()
  })

  $(canvasElement).contextmenu(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  })

  canvas.addEventListener(
    'mousemove',
    function (e) {
      mouse.x = e.pageX - this.offsetLeft
      mouse.y = e.pageY - this.offsetTop
    },
    false
  )

  canvas.addEventListener(
    'mousedown',
    () => {
      ctx.beginPath()
      ctx.moveTo(mouse.x, mouse.y)

      canvas.addEventListener('mousemove', onPaint, false)
    },
    false
  )

  canvas.addEventListener(
    'mouseup',
    () => {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      canvas.removeEventListener('mousemove', onPaint, false)
    },
    false
  )
}

// Note entry drag functions
function dragElement (elmnt) {
  var pos1 = 0
  var pos2 = 0
  var pos3 = 0
  var pos4 = 0
  if (document.getElementById(elmnt.id)) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id).onmousedown = dragMouseDown
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown
  }

  function dragMouseDown (e) {
    if ($(e.target).hasClass('note-entry')) {
      return
    }
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 > 0 ? elmnt.offsetTop - pos2 + 'px' : 0 + 'px'
    elmnt.style.left = elmnt.offsetLeft - pos1 > 0 ? elmnt.offsetLeft - pos1 + 'px' : 0 + 'px'
  }

  function closeDragElement () {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
    change = true
    $('.note-entry').blur()
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

// Save note content to local storage
$(document).on('blur', '.note-entry-host', () => {
  if (change) {
    // Remove empty note-entries and save all notes
    removeEmptyNoteEntries()
    saveNotes()
  }
})

// Focus on note entry host on click
$(document).on('click', '.note-entry-host', function () {
  $(this).focus()
})

// Focus on note entry on click
$(document).on('click', '.note-entry', function (e) {
  e.stopPropagation()
  $(this).focus()
})

// Delete note-entry handler
$(document).on('keydown', '.note-entry-host', function (e) {
  if ($(e.target).hasClass('note-entry-host') && (e.keyCode === 46 || e.keyCode === 8)) {
    $(e.target).remove()
    saveNotes()
  }
})

// Get note content from local storage
$('.note').each(function () {
  $(this)[0].innerHTML = JSON.parse(localStorage.getItem('notes'))
    ? JSON.parse(localStorage.getItem('notes'))[$(this).data('val')]
    : ''
})

// Toggle to selected note/sketch pair
$('.note-button').click((e) => {
  $('.note-button').removeClass('note-button-selected')
  $('.note, .sketch').hide(0)
  $(
    `#note-${$(e.currentTarget).data('val')}, #sketch-${$(e.currentTarget).data(
      'val'
    )}`
  ).show()
  $(`#note-button-${$(e.currentTarget).data('val')}`).addClass(
    'note-button-selected'
  )
})

// Toggle keep on top
$('.ontop-button').click(function () {
  if ($(this).hasClass('ontop-locked')) {
    $(this).removeClass('ontop-locked').addClass('ontop-unlocked')
    ipcRenderer.send('ontop-unlock')
  } else {
    $(this).removeClass('ontop-unlocked').addClass('ontop-locked')
    ipcRenderer.send('ontop-lock')
  }
})

// Toggle between note and sketch canvas
$('.sketch-button').click(function () {
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
$('.header-bar').dblclick(() => {
  maxRestoreWindow()
})

// Iterate and instantiate sketch canvases
$('.sketch').each(function () {
  sketchCanvas($(this), $(this).css('color'))
})

// Capture paste to note and push text only
// $('.note-entry').on('paste', function (e) {
//   e.preventDefault()
//   const caretPos = $(this)[0].selectionStart
//   const textAreaTxt = $(this).text()
//   const txtToAdd = clipboard.readText()
//   $(this).text(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos))
// })

// Add note entry at point of click
$('.note').click(function (e) {
  if ($(e.target).hasClass('note-entry-host') || $(e.target).hasClass('note-entry')) {
    return
  }
  const id = 'ne' + Date.now()
  const noteEntryHost = $(`<div id=${id} tabindex="0"></div>`)
  noteEntryHost.addClass('note-entry-host')
    .css('left', e.pageX - this.offsetLeft)
    .css('top', e.pageY - this.offsetTop)
    .appendTo(this)
  $('<div contenteditable="true"></div>')
    .addClass('note-entry')
    .appendTo(noteEntryHost)
    .focus()
  dragElement($(`#${id}`)[0])
})

// Add drag behavior to note-entries
$('.note-entry-host').each(function () {
  dragElement($(`#${this.id}`)[0])
})
