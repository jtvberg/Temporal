const $ = require('jquery')
let change = false

$('.note')[0].innerHTML = localStorage.getItem('note')

var noteMo = new window.MutationObserver(function(e) {
    change = true
})
noteMo.observe($('.note')[0], { childList: true, subtree: true, characterData: true })

$('.note').blur( () => {
  if (change) {
    console.log($('.note')[0].innerHTML)
    localStorage.setItem('note', $('.note')[0].innerHTML)
    change = false
  }
})

$('.note-button').click( (e) => {
  $('.note').hide()
  if ($(e.currentTarget).hasClass('color-1')) {
    $('#note-1').show()
  }
  if ($(e.currentTarget).hasClass('color-2')) {
    $('#note-2').show()
  }
  if ($(e.currentTarget).hasClass('color-3')) {
    $('#note-3').show()
  }
  if ($(e.currentTarget).hasClass('color-4')) {
    $('#note-4').show()
  }
  if ($(e.currentTarget).hasClass('color-5')) {
    $('#note-5').show()
  }
  if ($(e.currentTarget).hasClass('color-6')) {
    $('#note-6').show()
  }
})