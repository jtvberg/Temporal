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
  var observer = new window.MutationObserver(function (e) {
    change = true
  })
  observer.observe(note[0], { childList: true, subtree: true, characterData: true })
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
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    canvas.removeEventListener('mousemove', onPaint, false)
  }, false)
}

// Get note content from local storage
$('.note').each(function () {
  $(this)[0].innerHTML = JSON.parse(localStorage.getItem('notes')) ? JSON.parse(localStorage.getItem('notes'))[$(this).data('val')] : ''
})

// Save note content to local storage
$('.note').blur(() => {
  if (change) {
    const notes = []
    $('.note').each(function () {
      notes.push($(this)[0].innerHTML)
    })
    localStorage.setItem('notes', JSON.stringify(notes))
    change = false
  }
})

// Toggle to selected note/sketch pair
$('.note-button').click((e) => {
  $('.note-button').removeClass('note-button-selected')
  $('.note, .sketch').hide(0)
  $(`#note-${$(e.currentTarget).data('val')}, #sketch-${$(e.currentTarget).data('val')}`).show()
  $(`#note-button-${$(e.currentTarget).data('val')}`).addClass('note-button-selected')
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
$('.note').on('paste', function (e) {
  e.preventDefault()
  const caretPos = $(this)[0].selectionStart
  const textAreaTxt = $(this).text()
  const txtToAdd = clipboard.readText()
  $(this).text(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos))
})
