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
