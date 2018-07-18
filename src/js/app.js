import { console } from './dom-loader';
var hide = true;
document.getElementById('btn').addEventListener('click', function(e){
    hide = !hide;
    document.getElementsByClassName('content')[0].style.display = hide ? 'block' : 'none';
})

function debounce(func, delay) {
    var timeout;
    return function(e) {
        console.log("清除",timeout,e.target.value)
        clearTimeout(timeout);
        var context = this, args = arguments
        console.log("新的",timeout, e.target.value)
        timeout = setTimeout(function(){
          console.log("----")
          func.apply(context, args);
        },delay)
    };
};
 
var validate = debounce(function(e) {
    console.log("change", e.target.value, new Date-0)
}, 380);
 
// 绑定监听
document.querySelector("input").addEventListener('input', validate);



<div id='panel' style="background:red;width:200px;height:200px">
 
 </div>
 
 function throttle(fn, threshhold) {
 var timeout
 var start = new Date;
 var threshhold = threshhold || 160
 return function () {
  
 var context = this, args = arguments, curr = new Date() - 0
 clearTimeout(timeout)
 if(curr - start >= threshhold){
      console.log("now", curr, curr - start)
      fn.apply(context, args)
      start = curr
 }else{
      timeout = setTimeout(function(){
         fn.apply(context, args)
      }, threshhold);
     }
   }
 }
 var mousemove = throttle(function(e) {
 console.log(e.pageX, e.pageY)
 });
  

