const { parentPort } = require('worker_threads');
// Each task should know how to divy their work up. (if possible);
// Each task has a function called work and plan, workers execute the work function
// the scheduler uses the plan to work out how to divide the work up and task it out effectively

parentPort.on('message', (task) => {
  parentPort.postMessage(task.a + task.b);
});