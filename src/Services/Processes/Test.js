// Processes are different to workers
// They will spawn
process.on('message', (message) => {
    console.log(message);
    if(message.command=='SLEEP'){
      setTimeout(()=>{console.log("\nTest Child process Event-Loop :cpuIntensiveTask in child process blocks this event in child thread!")}
                ,1000);
      const result = cpuIntensiveTask(message.responseTime);
      process.send("Completed in :"+ result +" ms.");
    }
  });

  // const ac = new AbortController();// it could give you it's abort codes