const $ = require('jquery')
let change = false

$('#note-1')[0].innerHTML = localStorage.getItem('note')

var noteMo = new window.MutationObserver(function(e) {
    change = true
})
noteMo.observe($('#note-1')[0], { childList: true, subtree: true, characterData: true })

$('.note').blur( () => {
  if (change) {
    localStorage.setItem('note', $('#note-1')[0].innerHTML)
    change = false
  }
})

$('.note-button').click( (e) => {
  $('.note-button').removeClass('note-button-selected')
  $('.note').hide()
  $(`#note-${$(e.currentTarget).data('val')}`).show()
  $(`#note-button-${$(e.currentTarget).data('val')}`).addClass('note-button-selected')
})