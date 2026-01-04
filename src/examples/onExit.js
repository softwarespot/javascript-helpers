import onExit from '../onExit.js';

onExit(() => {
    console.log('Process is exiting, performing cleanup...');
});
