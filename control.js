const { fork } = require('child_process');

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
} 

(async () => {
    while (true) {
        console.log('start program');
        thisPromise = await new Promise((resolve, reject) => {
            const subprocess = fork('index.js');
            subprocess.on('exit', (code) => {
                return resolve();
            });
        });
        console.log('end program');
        await sleep(3600000);
    }
})();