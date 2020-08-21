const $ = require('jquery')
let change = false

$('#note-button-0').addClass('note-button-selected')
$('#note-0').show()

$('.note').each(function (e) {
  $(this)[0].innerHTML = JSON.parse(localStorage.getItem('notes')) ? JSON.parse(localStorage.getItem('notes'))[$(this).data('val')] : ''
})

$('.note').blur( () => {
  if (change) {
    let notes = []
    $('.note').each(function (e) {
      notes.push($(this)[0].innerHTML)
    })
    localStorage.setItem('notes', JSON.stringify(notes))
    change = false
  }
})

$('.note-button').click( (e) => {
  $('.note-button').removeClass('note-button-selected')
  $('.note').hide()
  $(`#note-${$(e.currentTarget).data('val')}`).show()
  $(`#note-button-${$(e.currentTarget).data('val')}`).addClass('note-button-selected')
})

function changeWatch (note) {
  var observer = new window.MutationObserver(function (e) {
    change = true
  })
  observer.observe(note[0], { childList: true, subtree: true, characterData: true })
}

changeWatch($('.note-host'))