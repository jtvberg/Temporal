let change = false
var note = document.getElementsByClassName('note')[0]
note.innerHTML = localStorage.getItem('note')
var noteMo = new window.MutationObserver(function(e) {
    change = true
})
noteMo.observe(note, { childList: true, subtree: true, characterData: true })
const noteBlur = () => {
  if (change) {
    console.log(note.innerHTML)
    localStorage.setItem('note', note.innerHTML)
    change = false
  }
}