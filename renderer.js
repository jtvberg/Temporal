const { ipcRenderer } = require('electron')
const $ = require('jquery')
let change = false
let winMax = false

$('#note-button-0').addClass('note-button-selected')
$('#note-0').show()
$('#sketch-0').show()

$('.note').each(function () {
  $(this)[0].innerHTML = JSON.parse(localStorage.getItem('notes')) ? JSON.parse(localStorage.getItem('notes'))[$(this).data('val')] : ''
})

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

$('.note-button').click((e) => {
  $('.note-button').removeClass('note-button-selected')
  $('.note, .sketch').hide(0)
  $(`#note-${$(e.currentTarget).data('val')}, #sketch-${$(e.currentTarget).data('val')}`).show()
  $(`#note-button-${$(e.currentTarget).data('val')}`).addClass('note-button-selected')
})

function changeWatch (note) {
  var observer = new window.MutationObserver(function (e) {
    change = true
  })
  observer.observe(note[0], { childList: true, subtree: true, characterData: true })
}

changeWatch($('.note-host'))

$('.ontop-button').click(function () {
  if ($(this).hasClass('ontop-locked')) {
    $(this).removeClass('ontop-locked').addClass('ontop-unlocked')
    ipcRenderer.send('ontop-unlock')
  } else {
    $(this).removeClass('ontop-unlocked').addClass('ontop-locked')
    ipcRenderer.send('ontop-lock')
  }
})

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

$('.header-bar').dblclick(() => {
  maxRestoreWindow()
})

function maxRestoreWindow () {
  if (!winMax) {
    ipcRenderer.send('win-max')
    winMax = true
  } else {
    ipcRenderer.send('win-restore')
    winMax = false
  }
}

function sketchCanvas (canvasElement, strokeColor) {
  const canvas = canvasElement
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

$('.sketch').each(function () {
  sketchCanvas($(this)[0], $(this).css('color'))
})
