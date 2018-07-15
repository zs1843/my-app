import { console } from 'dom-loader';
var hide = false;
document.getElementById('btn').addEventListener('click', function(e){
    hide = !hide;
    document.getElementsByClassName('content')[0].style.display = hide ? 'block' : 'none';
})
