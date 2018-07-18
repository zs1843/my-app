# setTimeout

- 任务队列中最后执行

```js
    for (var i = 1;i <= 5;i ++) {
        setTimeout(function timer() {
            console.log(i)
        },i * 1000)
    }

```

- 创建一个闭包作用域

```js
    for(var i = 0;i<5;i ++) {
        (function(i){
            setTimeout(function timer() {
            console.log(i)
            }, i * 1000);
        })(i);
    }

    var loop = function (i) {
        setTimeout(function timer() {
            console.log(i);  
        }, i*1000);
    };
    for (var i = 1;i <= 5; i++) {
        loop(i);
    }

```

```js
    console.log('global')

    setTimeout(function () {
    console.log('timeout1')
    new Promise(function (resolve) {
        console.log('timeout1_promise')
        resolve()
    }).then(function () {
        console.log('timeout1_then')
    })
    },2000)

    for (var i = 1;i <= 5;i ++) {
    setTimeout(function() {
        console.log(i)
    },i*1000)
    console.log(i)
    }

    new Promise(function (resolve) {
    console.log('promise1')
    resolve()
    }).then(function () {
    console.log('then1')
    })

    setTimeout(function () {
    console.log('timeout2')
    new Promise(function (resolve) {
        console.log('timeout2_promise')
        resolve()
    }).then(function () {
        console.log('timeout2_then')
    })
    }, 1000)

    new Promise(function (resolve) {
    console.log('promise2')
    resolve()
    }).then(function () {
    console.log('then2')
    })

```


```js

    async function async1() {
        console.log("async1 start");
        await  async2();
        console.log("async1 end");
    }
    async function async2() {
    console.log( 'async2');
    }
    console.log("script start");
    setTimeout(function () {
        console.log("settimeout");
    },0);
    async1();
    new Promise(function (resolve) {
        console.log("promise1");
        resolve();
    }).then(function () {
        console.log("promise2");
    });
    console.log('script end');

```